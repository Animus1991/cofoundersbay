'use client';

import { useState } from 'react';
import { Plus, X, GripVertical, Link as LinkIcon, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CustomField {
  id: string;
  type: 'text' | 'url' | 'date' | 'location' | 'select';
  label: string;
  value: string;
  options?: string[];
  icon?: string;
}

interface CustomFieldsEditorProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Briefcase },
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'location', label: 'Location', icon: MapPin },
];

export function CustomFieldsEditor({ fields, onChange }: CustomFieldsEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: '',
      value: '',
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    onChange(
      fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);
    
    onChange(newFields);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Add custom information to your profile
          </p>
        </div>
        <Button onClick={addField} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const Icon = FIELD_TYPES.find((t) => t.value === field.type)?.icon || Briefcase;
          
          return (
            <Card
              key={field.id}
              className={cn(
                'transition-all',
                draggedIndex === index && 'opacity-50'
              )}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="cursor-move mt-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) =>
                            updateField(field.id, { type: value as CustomField['type'] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Field Label</Label>
                        <Input
                          placeholder="e.g., Company, Portfolio, etc."
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, { label: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Value</Label>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type={field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                          placeholder={
                            field.type === 'url'
                              ? 'https://example.com'
                              : field.type === 'date'
                              ? 'Select date'
                              : 'Enter value'
                          }
                          value={field.value}
                          onChange={(e) =>
                            updateField(field.id, { value: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="text-destructive-accessible hover:text-destructive-accessible"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {fields.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No custom fields yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add custom fields to showcase additional information
              </p>
              <Button onClick={addField} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Field
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
