import { useEffect, useRef, useState } from "react";
import { useSharedValue, runOnUI } from "react-native-reanimated";
import { CloudLayoutEngine } from "../components/CloudLayout/CloudLayoutEngine";
import { ServiceNode } from "../types/types";
import { JarvisService } from "../types/types";

export function useCloudPhysics(
  width: number,
  height: number,
  services: JarvisService[]
) {
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const engineRef = useRef<CloudLayoutEngine | null>(null);
  const nodesSharedValue = useSharedValue<ServiceNode[]>([]);

  // Initialize physics engine
  useEffect(() => {
    if (width <= 0 || height <= 0) return;

    const onUpdate = (updatedNodes: ServiceNode[]) => {
      runOnUI(() => {
        "worklet";
        nodesSharedValue.value = updatedNodes;
      })();
      setNodes(updatedNodes);
    };

    engineRef.current = new CloudLayoutEngine(width, height, onUpdate);

    return () => {
      engineRef.current?.stop();
    };
  }, [width, height, nodesSharedValue]);

  // Update nodes when services change
  useEffect(() => {
    if (!engineRef.current) return;

    const serviceNodes: ServiceNode[] = services.map((service, index) => ({
      id: service.id,
      service,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
    }));

    engineRef.current.setNodes(serviceNodes);
  }, [services, width, height]);

  // Update dimensions when viewport changes
  useEffect(() => {
    if (engineRef.current && width > 0 && height > 0) {
      engineRef.current.updateDimensions(width, height);
    }
  }, [width, height]);

  const applyForce = (nodeId: string, fx: number, fy: number) => {
    engineRef.current?.applyForce(nodeId, fx, fy);
  };

  const releaseForce = (nodeId: string) => {
    engineRef.current?.releaseForce(nodeId);
  };

  const restart = () => {
    engineRef.current?.restart();
  };

  const stop = () => {
    engineRef.current?.stop();
  };

  return {
    nodes,
    nodesSharedValue,
    applyForce,
    releaseForce,
    restart,
    stop,
  };
}
