import React from "react";
import { Card, XStack, YStack, Text, Button, Checkbox } from "tamagui";
import { Calendar, Flag, MoreHorizontal, Clock } from "@tamagui/lucide-icons";
import type { TaskItemProps } from "../types";
import { formatRelativeDate, isOverdue, getPriorityColor, getStatusColor } from "../lib/utils";

export function TaskItem({ 
  task, 
  project,
  onPress, 
  onToggleComplete, 
  onEdit, 
  onDelete,
  showProject = false 
}: TaskItemProps) {
  const isCompleted = task.status === "completed";
  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);

  return (
    <Card
      elevate
      size="$3"
      bordered
      animation="bouncy"
      scale={1}
      hoverStyle={{ scale: 1.01 }}
      pressStyle={{ scale: 0.99 }}
      onPress={onPress}
      backgroundColor="$background"
      padding="$3"
      margin="$1"
      opacity={isCompleted ? 0.7 : 1}
    >
      <XStack alignItems="flex-start" space="$3">
        {/* Checkbox */}
        <Checkbox
          size="$4"
          checked={isCompleted}
          onCheckedChange={() => onToggleComplete?.()}
          backgroundColor={isCompleted ? "$green9" : "$background"}
          borderColor={isCompleted ? "$green9" : "$color7"}
        />

        {/* Content */}
        <YStack flex={1} space="$2">
          {/* Title and Project */}
          <YStack space="$1">
            <Text 
              fontSize="$4" 
              fontWeight="500" 
              color={isCompleted ? "$color9" : "$color12"}
              textDecorationLine={isCompleted ? "line-through" : "none"}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            
            {showProject && project && (
              <Text fontSize="$2" color="$color10">
                {project.icon} {project.name}
              </Text>
            )}
          </YStack>

          {/* Description */}
          {task.description && (
            <Text 
              fontSize="$3" 
              color="$color11" 
              numberOfLines={2}
              textDecorationLine={isCompleted ? "line-through" : "none"}
            >
              {task.description}
            </Text>
          )}

          {/* Metadata */}
          <XStack alignItems="center" space="$3" flexWrap="wrap">
            {/* Priority */}
            <XStack alignItems="center" space="$1">
              <Flag size="$1" color={priorityColor} />
              <Text fontSize="$2" color="$color11" textTransform="capitalize">
                {task.priority}
              </Text>
            </XStack>

            {/* Status */}
            {task.status !== "todo" && (
              <XStack alignItems="center" space="$1">
                <Clock size="$1" color={statusColor} />
                <Text fontSize="$2" color="$color11" textTransform="capitalize">
                  {task.status.replace("_", " ")}
                </Text>
              </XStack>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <XStack alignItems="center" space="$1">
                <Calendar size="$1" color={isTaskOverdue ? "$red10" : "$color11"} />
                <Text 
                  fontSize="$2" 
                  color={isTaskOverdue ? "$red10" : "$color11"}
                >
                  {formatRelativeDate(task.dueDate)}
                </Text>
              </XStack>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <XStack space="$1" flexWrap="wrap">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <Text
                    key={index}
                    fontSize="$1"
                    color="$color10"
                    backgroundColor="$color3"
                    paddingHorizontal="$1.5"
                    paddingVertical="$0.5"
                    borderRadius="$1"
                  >
                    #{tag}
                  </Text>
                ))}
                {task.tags.length > 2 && (
                  <Text fontSize="$1" color="$color10">
                    +{task.tags.length - 2} more
                  </Text>
                )}
              </XStack>
            )}
          </XStack>
        </YStack>

        {/* Action Menu */}
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
    </Card>
  );
}