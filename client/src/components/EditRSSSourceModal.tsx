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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditRSSSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    id: number;
    name: string;
    url: string;
    region: string;
  } | null;
  onSave: (data: { name: string; url: string; region: string }) => Promise<void>;
}

export function EditRSSSourceModal({
  isOpen,
  onClose,
  source,
  onSave,
}: EditRSSSourceModalProps) {
  const [name, setName] = useState(source?.name || "");
  const [url, setUrl] = useState(source?.url || "");
  const [region, setRegion] = useState(source?.region || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || !region.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name, url, region });
      toast.success("Fonte atualizada com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar fonte");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Fonte RSS</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da fonte RSS
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Fonte</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: MIT Tech Review"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL do Feed RSS</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="region">Região</Label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione uma região</option>
              <option value="usa">EUA</option>
              <option value="china">China</option>
              <option value="brasil">Brasil</option>
            </select>
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
