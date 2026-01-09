import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: {
    id: number;
    title: string;
    radarGlobal: string;
    temaCentral: string;
    ferramentaQuinzena: string;
    aplicacaoPratica: string;
  } | null;
  onSave: (data: {
    title: string;
    radarGlobal: string;
    temaCentral: string;
    ferramentaQuinzena: string;
    aplicacaoPratica: string;
  }) => Promise<void>;
}

export function EditScriptModal({
  isOpen,
  onClose,
  script,
  onSave,
}: EditScriptModalProps) {
  const [title, setTitle] = useState(script?.title || "");
  const [radarGlobal, setRadarGlobal] = useState(script?.radarGlobal || "");
  const [temaCentral, setTemaCentral] = useState(script?.temaCentral || "");
  const [ferramentaQuinzena, setFerramentaQuinzena] = useState(
    script?.ferramentaQuinzena || ""
  );
  const [aplicacaoPratica, setAplicacaoPratica] = useState(
    script?.aplicacaoPratica || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (
      !title.trim() ||
      !radarGlobal.trim() ||
      !temaCentral.trim() ||
      !ferramentaQuinzena.trim() ||
      !aplicacaoPratica.trim()
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title,
        radarGlobal,
        temaCentral,
        ferramentaQuinzena,
        aplicacaoPratica,
      });
      toast.success("Roteiro atualizado com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar roteiro");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Roteiro</DialogTitle>
          <DialogDescription>
            Atualize as seções do roteiro do podcast
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título do Episódio</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do episódio"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="radar">Radar Global</Label>
            <Textarea
              id="radar"
              value={radarGlobal}
              onChange={(e) => setRadarGlobal(e.target.value)}
              placeholder="Tendências globais de IA"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tema">Tema Central</Label>
            <Textarea
              id="tema"
              value={temaCentral}
              onChange={(e) => setTemaCentral(e.target.value)}
              placeholder="Tema principal do episódio"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ferramenta">Ferramenta da Quinzena</Label>
            <Textarea
              id="ferramenta"
              value={ferramentaQuinzena}
              onChange={(e) => setFerramentaQuinzena(e.target.value)}
              placeholder="Ferramenta de IA recomendada"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aplicacao">Aplicação Prática</Label>
            <Textarea
              id="aplicacao"
              value={aplicacaoPratica}
              onChange={(e) => setAplicacaoPratica(e.target.value)}
              placeholder="Como aplicar na prática"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
