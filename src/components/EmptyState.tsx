import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon: React.ElementType; // Um componente de ícone do Lucide
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, buttonText, onButtonClick }: EmptyStateProps) => {
  return (
    <Card className="shadow-primary/10 border-primary/20 text-center py-12">
      <CardContent className="space-y-4">
        <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {buttonText && onButtonClick && (
          <Button className="gradient-primary text-white" onClick={onButtonClick}>
            <Plus className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;