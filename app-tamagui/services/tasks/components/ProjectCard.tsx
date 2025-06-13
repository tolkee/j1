import React from "react";
import { Card, XStack, YStack, Text, Button, Progress } from "tamagui";
import { MoreHorizontal, Calendar, CheckCircle } from "@tamagui/lucide-icons";
import type { ProjectCardProps } from "../types";
import { getTaskProgress } from "../lib/utils";

export function ProjectCard({ 
  project, 
  stats, 
  onPress, 
  onEdit, 
  onDelete 
}: ProjectCardProps) {
  const progress = stats ? getTaskProgress([
    ...Array(stats.completedTasks).fill({ status: "completed" }),
    ...Array(stats.todoTasks + stats.inProgressTasks).fill({ status: "todo" })
  ]) : { completed: 0, total: 0, percentage: 0 };

  return (
    <Card
      elevate
      size="$4"
      bordered
      animation="bouncy"
      scale={1}
      hoverStyle={{ scale: 1.02 }}
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      backgroundColor="$background"
      padding="$4"
      margin="$2"
    >
      <YStack space="$3">
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" space="$2" flex={1}>
            <Text fontSize="$6">{project.icon}</Text>
            <YStack flex={1}>
              <Text fontSize="$5" fontWeight="600" color="$color12">
                {project.name}
              </Text>
              {project.description && (
                <Text fontSize="$3" color="$color11" numberOfLines={1}>
                  {project.description}
                </Text>
              )}
            </YStack>
          </XStack>
          
          {(onEdit || onDelete) && (
            <Button
              size="$2"
              variant="ghost"
              circular
              icon={MoreHorizontal}
              onPress={(e) => {
                e.stopPropagation();
                // TODO: Show context menu
              }}
            />
          )}
        </XStack>

        {/* Stats */}
        {stats && (
          <YStack space="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$2" color="$color11">
                {progress.completed} of {progress.total} tasks completed
              </Text>
              <Text fontSize="$2" color="$color11">
                {progress.percentage}%
              </Text>
            </XStack>
            
            <Progress 
              value={progress.percentage} 
              backgroundColor="$color4"
              size="$2"
            >
              <Progress.Indicator 
                animation="bouncy" 
                backgroundColor={project.color}
              />
            </Progress>

            <XStack space="$4">
              <XStack alignItems="center" space="$1">
                <CheckCircle size="$1" color="$green10" />
                <Text fontSize="$2" color="$color11">
                  {stats.completedTasks}
                </Text>
              </XStack>
              
              <XStack alignItems="center" space="$1">
                <Calendar size="$1" color="$blue10" />
                <Text fontSize="$2" color="$color11">
                  {stats.inProgressTasks}
                </Text>
              </XStack>
              
              {stats.overdueTasks > 0 && (
                <XStack alignItems="center" space="$1">
                  <Calendar size="$1" color="$red10" />
                  <Text fontSize="$2" color="$red10">
                    {stats.overdueTasks} overdue
                  </Text>
                </XStack>
              )}
            </XStack>
          </YStack>
        )}

        {/* Status Badge */}
        {project.isDefault && (
          <XStack>
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
          </XStack>
        )}
      </YStack>
    </Card>
  );
}