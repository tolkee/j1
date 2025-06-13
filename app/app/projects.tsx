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
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/common/lib/api';
import { Button, Card } from '@/common/components/ui';
import { useAuth } from '@/services/auth/contexts/AuthContext';

interface Project {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  status: 'active' | 'completed' | 'archived';
  isDefault: boolean;
  displayOrder: number;
  createdAt: number;
  updatedAt: number;
}

export default function ProjectsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();
  
  // Convex queries and mutations
  const projects = useQuery(api.tasks.projects.list, {});
  const createProject = useMutation(api.tasks.projects.create);
  
  const isLoading = projects === undefined;

  const onRefresh = async () => {
    setRefreshing(true);
    // Convex automatically refetches, so we just simulate a refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddProject = () => {
    Alert.prompt(
      'New Project',
      'Enter the project name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (name) => {
            if (name?.trim()) {
              try {
                await createProject({
                  name: name.trim(),
                  description: '',
                  color: getRandomColor(),
                  icon: getRandomIcon(),
                });
              } catch (error) {
                console.error('Failed to create project:', error);
                Alert.alert('Error', 'Failed to create project');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleProjectPress = (project: Project) => {
    // Navigate to project details or tasks
    console.log('Navigate to project:', project.name);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.8}
    >
      <Card variant="elevated" style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <View style={styles.projectIcon}>
            <Text style={styles.projectEmoji}>{item.icon}</Text>
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.projectDescription}>{item.description}</Text>
            )}
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <View
          style={[styles.projectColorBar, { backgroundColor: item.color }]}
        />
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Projects Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first project to get started organizing your tasks.
      </Text>
      <Button
        title="Create First Project"
        onPress={handleAddProject}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.username || 'User'}
          </Text>
          <Text style={styles.headerTitle}>Projects</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Add Project Button */}
        <Button
          title="Add Project"
          onPress={handleAddProject}
          style={styles.addButton}
          icon={<Text style={styles.addIcon}>+</Text>}
        />

        {/* Projects List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            renderItem={renderProject}
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

// Helper functions
const getRandomColor = () => {
  const colors = [
    '#007AFF', '#FF3B30', '#34C759', '#FF9500',
    '#AF52DE', '#FF2D92', '#5AC8FA', '#FFCC00'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomIcon = () => {
  const icons = ['📋', '💼', '🚀', '📊', '🎯', '⭐', '🔥', '💡'];
  return icons[Math.floor(Math.random() * icons.length)];
};

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
  greeting: {
    fontSize: 16,
    color: '#6E6E73',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
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
  projectCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  projectEmoji: {
    fontSize: 24,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  projectColorBar: {
    height: 4,
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