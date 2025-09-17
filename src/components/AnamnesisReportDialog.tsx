import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Lightbulb, BookOpen } from "lucide-react";

interface AnamnesisReport {
  summary: string;
  challenges_risks: string[];
  suggestions: string[];
  scientific_basis: string[];
}

interface AnamnesisReportDialogProps {
  report: AnamnesisReport | null;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnamnesisReportDialog = ({ report, studentName, open, onOpenChange }: AnamnesisReportDialogProps) => {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gradient">
            <BookOpen className="h-6 w-6" />
            Relatório de Anamnese - {studentName}
          </DialogTitle>
          <DialogDescription>
            Análise gerada por IA com base nos dados da anamnese. Use este relatório como um guia profissional.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 space-y-6 p-1 pr-4">
          {/* Resumo */}
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-primary mb-2">Resumo da Análise</h3>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
          </div>

          {/* Desafios e Riscos */}
          {report.challenges_risks.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Desafios e Riscos Identificados
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {report.challenges_risks.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sugestões */}
          {report.suggestions.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Sugestões para o Plano de Ação
              </h3>
              <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                {report.suggestions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Base Científica */}
          {report.scientific_basis.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Base Científica (ACSM/NSCA)
              </h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                {report.scientific_basis.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} className="gradient-primary">
            <CheckCircle className="mr-2 h-4 w-4" />
            Entendi e Usarei como Guia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnamnesisReportDialog;