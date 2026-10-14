"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProviderSettings } from "@/lib/types";
import { useStudio } from "@/lib/store";
import { defaultModel } from "@/lib/providers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const settings = useStudio((s) => s.settings);
  const setSettings = useStudio((s) => s.setSettings);
  const [draft, setDraft] = useState<ProviderSettings>(settings);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(useStudio.getState().settings);
        onOpenChange(v);
      }}
    >
      <DialogContent data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle>Model keys</DialogTitle>
          <DialogDescription>
            Keys stay in this browser unless you also set server env vars. OpenAI-compatible endpoints work via a custom base URL.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Provider</Label>
            <Select
              value={draft.provider}
              onValueChange={(v) => {
                const provider = v as ProviderSettings["provider"];
                setDraft({ ...draft, provider, model: defaultModel(provider) });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="compatible">OpenAI-compatible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Model</Label>
            <Input value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />
          </div>
          {draft.provider === "compatible" && (
            <div className="space-y-1">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.example.com/v1"
                value={draft.baseUrl}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>API key</Label>
            <Input
              type="password"
              data-testid="api-key"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
          </div>
          <Button
            onClick={() => {
              setSettings(draft);
              onOpenChange(false);
            }}
          >
            Save on this device
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
