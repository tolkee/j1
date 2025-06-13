import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  style,
  children,
  ...props
}) => {
  const cardStyles = [
    styles.card,
    styles[variant],
    styles[`${padding}Padding`],
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#FFF',
  },
  
  // Variants
  default: {
    backgroundColor: '#FFF',
  },
  elevated: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },

  // Padding
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 20,
  },
  largePadding: {
    padding: 24,
  },
});