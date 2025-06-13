import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/common/lib/api';
import { Button, Card } from '@/common/components/ui';
import { useAuth } from '@/services/auth/contexts/AuthContext';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  dueDate?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export default function TasksScreen() {
  const { projectId } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const { isAuthenticated } = useAuth();

  // Convex queries and mutations
  const project = useQuery(api.tasks.projects.get, isAuthenticated ? { id: projectId as string } : "skip");
  const allTasks = useQuery(api.tasks.tasks.list, isAuthenticated ? { projectId: projectId as string } : "skip");
  const toggleTaskComplete = useMutation(api.tasks.tasks.toggleComplete);
  const updateTask = useMutation(api.tasks.tasks.update);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const isLoading = project === undefined || allTasks === undefined;

  // Filter tasks based on status
  const tasks = allTasks?.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  }) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddTask = () => {
    router.push({
      pathname: '/tasks/new',
      params: { projectId }
    });
  };

  const handleTaskPress = (task: Task) => {
    router.push(`/tasks/edit/${task._id}`);
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      if (task.status === 'completed') {
        await updateTask({ id: task._id, status: 'todo' });
      } else {
        await toggleTaskComplete({ id: task._id });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'todo': return '⭕';
      default: return '⭕';
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity onPress={() => handleTaskPress(item)} activeOpacity={0.8}>
      <Card variant="outlined" style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <TouchableOpacity 
            onPress={() => handleToggleStatus(item)}
            style={styles.statusButton}
          >
            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          </TouchableOpacity>
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              item.status === 'completed' && styles.completedTask
            ]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.taskMeta}>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(item.priority) }
              ]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
              {item.dueDate && (
                <Text style={styles.dueDateText}>
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      {['all', 'todo', 'in_progress', 'completed'].map((status) => (
        <TouchableOpacity
          key={status}
          onPress={() => setFilterStatus(status as any)}
          style={[
            styles.filterButton,
            filterStatus === status && styles.activeFilter
          ]}
        >
          <Text style={[
            styles.filterText,
            filterStatus === status && styles.activeFilterText
          ]}>
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Tasks Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first task to get started with this project.
      </Text>
      <Button
        title="Create First Task"
        onPress={handleAddTask}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.projectName}>{project?.name || 'Loading...'}</Text>
            <Text style={styles.headerTitle}>Tasks</Text>
          </View>
        </View>
      </View>

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Content */}
      <View style={styles.content}>
        {/* Add Task Button */}
        <Button
          title="Add Task"
          onPress={handleAddTask}
          style={styles.addButton}
          icon={<Text style={styles.addIcon}>+</Text>}
        />

        {/* Tasks List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
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
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerLeft: {
    flex: 1,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  projectName: {
    fontSize: 16,
    color: '#6E6E73',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  activeFilterText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  addButton: {
    marginBottom: 24,
  },
  addIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  listContainer: {
    paddingBottom: 24,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  statusButton: {
    padding: 4,
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 20,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  dueDateText: {
    fontSize: 12,
    color: '#8E8E93',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6E6E73',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
});