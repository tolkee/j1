import React, { useState } from "react";
import { Sheet, Button, XStack, YStack, Text, ScrollView } from "tamagui";
import { ChevronDown, Plus } from "@tamagui/lucide-icons";
import type { Project, Id } from "../types";
import { sortProjects } from "../lib/utils";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: Id<"projects">;
  onProjectSelect: (projectId: Id<"projects">) => void;
  onCreateProject?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  placeholder = "Select a project",
  disabled = false,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const sortedProjects = sortProjects(projects);
  const selectedProject = projects.find(p => p._id === selectedProjectId);

  const handleProjectSelect = (projectId: Id<"projects">) => {
    onProjectSelect(projectId);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onPress={() => setIsOpen(true)}
        disabled={disabled}
        variant="outlined"
        justifyContent="space-between"
        iconAfter={ChevronDown}
        backgroundColor="$background"
        borderColor="$color7"
        paddingHorizontal="$3"
        paddingVertical="$3"
      >
        {selectedProject ? (
          <XStack alignItems="center" space="$2">
            <Text fontSize="$4">{selectedProject.icon}</Text>
            <Text fontSize="$4" color="$color12">
              {selectedProject.name}
            </Text>
          </XStack>
        ) : (
          <Text fontSize="$4" color="$color11">
            {placeholder}
          </Text>
        )}
      </Button>

      <Sheet
        modal
        open={isOpen}
        onOpenChange={setIsOpen}
        snapPoints={[50]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Handle />
        <Sheet.Frame padding="$4" backgroundColor="$background">
          <YStack space="$4" flex={1}>
            <Text fontSize="$6" fontWeight="600" textAlign="center">
              Select Project
            </Text>

            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              <YStack space="$2">
                {sortedProjects.map((project) => (
                  <Button
                    key={project._id}
                    onPress={() => handleProjectSelect(project._id)}
                    variant="ghost"
                    justifyContent="flex-start"
                    backgroundColor={
                      selectedProjectId === project._id ? "$color4" : "transparent"
                    }
                    padding="$3"
                    borderRadius="$3"
                  >
                    <XStack alignItems="center" space="$3" flex={1}>
                      <Text fontSize="$5">{project.icon}</Text>
                      <YStack flex={1} alignItems="flex-start">
                        <Text fontSize="$4" fontWeight="500" color="$color12">
                          {project.name}
                        </Text>
                        {project.description && (
                          <Text fontSize="$3" color="$color11" numberOfLines={1}>
                            {project.description}
                          </Text>
                        )}
                      </YStack>
                      {project.isDefault && (
                        <Text
                          fontSize="$1"
                          color="$blue11"
                          backgroundColor="$blue3"
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          Default
                        </Text>
                      )}
                    </XStack>
                  </Button>
                ))}
              </YStack>
            </ScrollView>

            {onCreateProject && (
              <Button
                onPress={() => {
                  onCreateProject();
                  setIsOpen(false);
                }}
                variant="outlined"
                icon={Plus}
                iconAfter={null}
              >
                Create New Project
              </Button>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}