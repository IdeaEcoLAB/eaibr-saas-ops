import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  getUpcomingEpisode,
  getEpisodeById,
  getAllEpisodes,
  createEpisode,
  updateEpisodeStatus,
  getAllContentSources,
  getContentSourcesByRegion,
  createContentSource,
  getRecentContentItems,
  createContentItem,
  getPreCurationAnalysisByContentId,
  createPreCurationAnalysis,
  getEpisodeCurations,
  createEpisodeCuration,
  getPodcastScriptByEpisodeId,
  createOrUpdatePodcastScript,
  getBlogPostByEpisodeId,
  createOrUpdateBlogPost,
  getAllEditorialPillars,
  createEditorialPillar,
  getSocialMicrocontentsByEpisodeId,
  createSocialMicrocontent,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    getOverview: protectedProcedure.query(async () => {
      const upcomingEpisode = await getUpcomingEpisode();
      const allEpisodes = await getAllEpisodes(10);
      const contentSources = await getAllContentSources(true);
      const pillars = await getAllEditorialPillars();

      return {
        upcomingEpisode,
        recentEpisodes: allEpisodes,
        totalSources: contentSources.length,
        totalPillars: pillars.length,
      };
    }),
  }),

  // ============ EPISODES ============
  episodes: router({
    getUpcoming: protectedProcedure.query(async () => {
      return getUpcomingEpisode();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getEpisodeById(input.id);
      }),

    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return getAllEpisodes(input.limit, input.offset);
      }),

    create: protectedProcedure
      .input(
        z.object({
          episodeNumber: z.number(),
          scheduledDate: z.date(),
          title: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createEpisode(input.episodeNumber, input.scheduledDate, input.title);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          episodeId: z.number(),
          status: z.enum(["planning", "curation", "scripting", "review", "published"]),
          progress: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return updateEpisodeStatus(input.episodeId, input.status, input.progress);
      }),
  }),

  // ============ CONTENT SOURCES ============
  sources: router({
    getAll: protectedProcedure.query(async () => {
      return getAllContentSources(true);
    }),

    getByRegion: protectedProcedure
      .input(z.object({ region: z.enum(["brasil", "usa", "china", "global"]) }))
      .query(async ({ input }) => {
        return getContentSourcesByRegion(input.region);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          url: z.string().url(),
          sourceType: z.enum(["rss", "newsletter", "website", "social"]),
          region: z.enum(["brasil", "usa", "china", "global"]),
          pillarId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createContentSource(input);
      }),
  }),

  // ============ CONTENT ITEMS & CURATION ============
  content: router({
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return getRecentContentItems(input.limit);
      }),

    analyzeWithAI: protectedProcedure
      .input(
        z.object({
          contentItemId: z.number(),
          title: z.string(),
          description: z.string(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are an AI content curator for a business podcast about AI applications. 
                Analyze the provided content and classify it according to:
                1. Theme (e.g., Productivity, Marketing, Operations, Decision Making, Global Trends)
                2. Maturity Level (beginner, intermediate, advanced)
                3. Practical Impact (low, medium, high)
                4. Relevance Score (0-1)
                5. Brief summary in Portuguese
                
                Respond in JSON format with these exact fields: theme, maturityLevel, practicalImpact, relevanceScore, summary`,
              },
              {
                role: "user",
                content: `Title: ${input.title}\n\nDescription: ${input.description}\n\nContent: ${input.content || "N/A"}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "content_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    theme: { type: "string" },
                    maturityLevel: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                    practicalImpact: { type: "string", enum: ["low", "medium", "high"] },
                    relevanceScore: { type: "number", minimum: 0, maximum: 1 },
                    summary: { type: "string" },
                  },
                  required: ["theme", "maturityLevel", "practicalImpact", "relevanceScore", "summary"],
                  additionalProperties: false,
                },
              },
            },
          });

          const messageContent = response.choices[0]?.message.content;
          const content = typeof messageContent === 'string' ? messageContent : '';
          if (!content) throw new Error("No response from LLM");

          const analysis = JSON.parse(content);
          
          await createPreCurationAnalysis({
            contentItemId: input.contentItemId,
            theme: analysis.theme,
            maturityLevel: analysis.maturityLevel,
            practicalImpact: analysis.practicalImpact,
            relevanceScore: analysis.relevanceScore,
            summary: analysis.summary,
            aiAnalysis: analysis,
          });

          return analysis;
        } catch (error) {
          console.error("AI analysis error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to analyze content with AI",
          });
        }
      }),
  }),

  // ============ EPISODE CURATION ============
  curation: router({
    getByEpisode: protectedProcedure
      .input(z.object({ episodeId: z.number() }))
      .query(async ({ input }) => {
        return getEpisodeCurations(input.episodeId);
      }),

    addToEpisode: protectedProcedure
      .input(
        z.object({
          episodeId: z.number(),
          contentItemId: z.number(),
          pillarId: z.number(),
          section: z.enum(["radar_global", "tema_central", "ferramenta", "aplicacao"]),
          notes: z.string().optional(),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return createEpisodeCuration(input);
      }),
  }),

  // ============ SCRIPT GENERATION ============
  scripts: router({
    getByEpisode: protectedProcedure
      .input(z.object({ episodeId: z.number() }))
      .query(async ({ input }) => {
        return getPodcastScriptByEpisodeId(input.episodeId);
      }),

    generate: protectedProcedure
      .input(
        z.object({
          episodeId: z.number(),
          curations: z.array(
            z.object({
              section: z.enum(["radar_global", "tema_central", "ferramenta", "aplicacao"]),
              items: z.array(
                z.object({
                  title: z.string(),
                  description: z.string(),
                  url: z.string(),
                })
              ),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const curationsText = input.curations
            .map((c: any) => {
              const itemsText = c.items
                .map((i: any) => `- ${i.title}: ${i.description}`)
                .join("\n");
              return `${c.section}:\n${itemsText}`;
            })
            .join("\n\n");

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a professional podcast scriptwriter for a business podcast about AI applications in Portuguese.
                Create a podcast script with exactly these four sections:
                1. Radar Global (5 min) - 3 key insights (1 USA, 1 China, 1 Brazil)
                2. Tema Central (10-15 min) - A real problem and how AI is being used
                3. Ferramenta da Quinzena (5 min) - 1 tool, 1 case, 1 limitation
                4. Aplicação Prática (5 min) - "If you are [profession X], do this"
                
                Write in a conversational, professional tone suitable for a podcast.
                Include natural transitions between sections.`,
              },
              {
                role: "user",
                content: `Please create a podcast script based on these curated items:\n\n${curationsText}`,
              },
            ],
          });

          const messageContent = response.choices[0]?.message.content;
          const fullScript = typeof messageContent === 'string' ? messageContent : '';

          // Parse script into sections (simplified - in production, use structured output)
          const sections = {
            radarGlobal: fullScript.split("Tema Central")[0] || "",
            temaCentral: fullScript.split("Ferramenta da Quinzena")[0]?.split("Tema Central")[1] || "",
            ferramentaQuinzena:
              fullScript.split("Aplicação Prática")[0]?.split("Ferramenta da Quinzena")[1] || "",
            aplicacaoPratica: fullScript.split("Aplicação Prática")[1] || "",
          };

          const estimatedDuration = Math.round(fullScript.split(" ").length / 130); // ~130 words per minute

          await createOrUpdatePodcastScript(input.episodeId, {
            ...sections,
            fullScript,
            estimatedDuration,
          });

          return {
            ...sections,
            fullScript,
            estimatedDuration,
          };
        } catch (error) {
          console.error("Script generation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate podcast script",
          });
        }
      }),
  }),

  // ============ BLOG GENERATION ============
  blog: router({
    getByEpisode: protectedProcedure
      .input(z.object({ episodeId: z.number() }))
      .query(async ({ input }) => {
        return getBlogPostByEpisodeId(input.episodeId);
      }),

    generate: protectedProcedure
      .input(
        z.object({
          episodeId: z.number(),
          podcastScript: z.string(),
          episodeTitle: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a professional blog writer for a business AI blog in Portuguese.
                Convert the podcast script into a well-structured blog post with:
                - Engaging title
                - Introduction (2-3 paragraphs)
                - Main sections with headers
                - Practical tips and takeaways
                - Conclusion with call-to-action
                - Use markdown formatting
                - Include relevant emojis sparingly
                - Aim for 1000-1500 words`,
              },
              {
                role: "user",
                content: `Convert this podcast script into a blog post:\n\nTitle: ${input.episodeTitle}\n\nScript:\n${input.podcastScript}`,
              },
            ],
          });

          const messageContent = response.choices[0]?.message.content;
          const content = typeof messageContent === 'string' ? messageContent : '';
          const slug = input.episodeTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          const excerpt = content.substring(0, 200) + "...";

          await createOrUpdateBlogPost(input.episodeId, {
            title: input.episodeTitle,
            slug,
            content,
            excerpt,
            status: "draft",
          });

          return {
            title: input.episodeTitle,
            slug,
            content,
            excerpt,
            status: "draft",
          };
        } catch (error) {
          console.error("Blog generation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate blog post",
          });
        }
      }),
  }),

  // ============ SOCIAL MEDIA ============
  social: router({
    getByEpisode: protectedProcedure
      .input(z.object({ episodeId: z.number() }))
      .query(async ({ input }) => {
        return getSocialMicrocontentsByEpisodeId(input.episodeId);
      }),

    generateMicrocontents: protectedProcedure
      .input(
        z.object({
          episodeId: z.number(),
          podcastScript: z.string(),
          episodeTitle: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a social media content strategist for a business AI podcast in Portuguese.
                Generate 4 different social media posts (one for each platform):
                1. Twitter/X (280 characters max, with relevant hashtags)
                2. LinkedIn (professional tone, 1300 chars max)
                3. Instagram (engaging, emoji-friendly, 2200 chars max)
                4. TikTok (trendy, casual, hook-first, 150 chars)
                
                Format your response as JSON with keys: twitter, linkedin, instagram, tiktok
                Each should have: content, hashtags (array)`,
              },
              {
                role: "user",
                content: `Create social media posts for this podcast episode:\n\nTitle: ${input.episodeTitle}\n\nScript excerpt:\n${input.podcastScript.substring(0, 500)}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "social_posts",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    twitter: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                      },
                    },
                    linkedin: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                      },
                    },
                    instagram: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                      },
                    },
                    tiktok: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                  required: ["twitter", "linkedin", "instagram", "tiktok"],
                  additionalProperties: false,
                },
              },
            },
          });

          const messageContent = response.choices[0]?.message.content;
          const content = typeof messageContent === 'string' ? messageContent : '';
          if (!content) throw new Error("No response from LLM");

          const posts = JSON.parse(content);
          const platforms = ["twitter", "linkedin", "instagram", "tiktok"] as const;

          for (const platform of platforms) {
            const post = posts[platform];
            if (post) {
              await createSocialMicrocontent({
                episodeId: input.episodeId,
                platform,
                content: post.content,
                characterCount: post.content.length,
                suggestedHashtags: post.hashtags?.join(" ") || "",
              });
            }
          }

          return posts;
        } catch (error) {
          console.error("Social content generation error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate social media content",
          });
        }
      }),
  }),

  // ============ EDITORIAL PILLARS ============
  pillars: router({
    getAll: protectedProcedure.query(async () => {
      return getAllEditorialPillars();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createEditorialPillar(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
