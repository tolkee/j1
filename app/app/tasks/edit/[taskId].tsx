import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/common/lib/api';
import { Button, Input } from '@/common/components/ui';
import { useAuth } from '@/services/auth/contexts/AuthContext';

export default function EditTaskScreen() {
  const { taskId } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const task = useQuery(api.tasks.tasks.get, isAuthenticated ? { id: taskId as string } : "skip");
  const updateTask = useMutation(api.tasks.tasks.update);
  const removeTask = useMutation(api.tasks.tasks.remove);
  const titleInputRef = useRef<TextInput>(null);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const isTaskLoading = task === undefined;

  // Populate form when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }
  }, [task]);

  // Focus the title input when screen loads (with delay for modal)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (task) { // Only focus when task data is loaded
        titleInputRef.current?.focus();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setIsLoading(true);
    try {
      await updateTask({
        id: taskId as string,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      });
      router.back();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTask({ id: taskId as string });
              router.back();
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (task && (
      title !== task.title ||
      description !== (task.description || '') ||
      priority !== task.priority ||
      status !== task.status ||
      dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
    )) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const renderPrioritySelector = () => (
    <View style={styles.priorityContainer}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.priorityButtons}>
        {['low', 'medium', 'high'].map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPriority(p as any)}
            style={[
              styles.priorityButton,
              priority === p && styles.activePriorityButton,
              { backgroundColor: getPriorityColor(p, priority === p) }
            ]}
          >
            <Text style={[
              styles.priorityButtonText,
              priority === p && styles.activePriorityButtonText
            ]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatusSelector = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.label}>Status</Text>
      <View style={styles.statusButtons}>
        {[
          { key: 'todo', label: 'To Do', color: '#8E8E93' },
          { key: 'in_progress', label: 'In Progress', color: '#FF9500' },
          { key: 'completed', label: 'Completed', color: '#34C759' },
        ].map((s) => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setStatus(s.key as any)}
            style={[
              styles.statusButton,
              status === s.key && styles.activeStatusButton,
              { backgroundColor: status === s.key ? s.color : '#F2F2F7' }
            ]}
          >
            <Text style={[
              styles.statusButtonText,
              status === s.key && styles.activeStatusButtonText
            ]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const getPriorityColor = (p: string, isActive: boolean) => {
    if (!isActive) return '#F2F2F7';
    switch (p) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#F2F2F7';
    }
  };

  if (isTaskLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={isLoading}
        >
          <Text style={[styles.saveText, isLoading && styles.disabledText]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <Input
            ref={titleInputRef}
            label="Title *"
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Enter task description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Status */}
        <View style={styles.section}>
          {renderStatusSelector()}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          {renderPrioritySelector()}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Input
            label="Due Date (Optional)"
            placeholder="YYYY-MM-DD"
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            Format: YYYY-MM-DD (e.g., 2024-12-31)
          </Text>
        </View>

        {/* Delete Button */}
        <View style={styles.section}>
          <Button
            title="Delete Task"
            onPress={handleDelete}
            variant="outline"
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerButton: {
    padding: 8,
    minWidth: 80,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  disabledText: {
    color: '#8E8E93',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    padding: 16,
    fontSize: 16,
    color: '#1D1D1F',
    minHeight: 100,
  },
  priorityContainer: {
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activePriorityButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  activePriorityButtonText: {
    color: '#FFF',
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeStatusButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  activeStatusButtonText: {
    color: '#FFF',
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  deleteButton: {
    borderColor: '#FF3B30',
    marginBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6E6E73',
  },
});