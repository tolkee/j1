import React, { Component, ErrorInfo, ReactNode } from "react";
import { YStack, Text, Button } from "tamagui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class FinanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Finance service error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <YStack
          flex={1}
          bg="$background"
          justifyContent="center"
          alignItems="center"
          gap="$4"
          p="$6"
        >
          <Text
            fontSize="$6"
            color="$red9"
            textAlign="center"
            fontWeight="bold"
          >
            Finance Service Error
          </Text>
          <Text fontSize="$4" color="$color" textAlign="center" maxWidth={300}>
            Something went wrong with the finance service. Please try again or
            check your connection.
          </Text>
          {this.state.error && (
            <Text
              fontSize="$3"
              color="$color12"
              textAlign="center"
              maxWidth={300}
            >
              Error: {this.state.error.message}
            </Text>
          )}
          <Button
            bg="$green9"
            color="white"
            onPress={this.handleRetry}
            marginTop="$4"
          >
            Retry
          </Button>
        </YStack>
      );
    }

    return this.props.children;
  }
}
