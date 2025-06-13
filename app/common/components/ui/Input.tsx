import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'default' | 'password';
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, icon, endIcon, variant, style, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = variant === 'password';
    const secureTextEntry = isPassword ? !isPasswordVisible : props.secureTextEntry;

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    const EyeIcon = () => (
      <TouchableOpacity
        onPress={togglePasswordVisibility}
        style={styles.iconButton}
        activeOpacity={0.7}
      >
        <Text style={styles.eyeIcon}>
          {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            error && styles.inputContainerError,
          ]}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              icon && styles.inputWithIcon,
              (endIcon || isPassword) && styles.inputWithEndIcon,
              style,
            ]}
            secureTextEntry={secureTextEntry}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            placeholderTextColor="#999"
            {...props}
          />
          {isPassword && <EyeIcon />}
          {!isPassword && endIcon && (
            <View style={styles.iconContainer}>{endIcon}</View>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    backgroundColor: '#FAFBFC',
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#FFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  inputWithEndIcon: {
    paddingRight: 8,
  },
  iconContainer: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
});