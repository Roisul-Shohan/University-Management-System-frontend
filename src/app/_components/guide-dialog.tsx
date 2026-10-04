"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, X } from "lucide-react";

export function GuideDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="help-link" type="button">
          View guide <ArrowUpRight size={14} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Close className="dialog-close" aria-label="Close guide">
            <X size={18} />
          </Dialog.Close>
          <Dialog.Title className="dialog-title">Northstar quick guide</Dialog.Title>
          <Dialog.Description className="dialog-description">
            Use the sidebar to move between your role&apos;s workspace areas. Admins manage academic setup, teachers manage curriculum, and students can complete eligible payments.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button className="submit-button" type="button">Got it</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
