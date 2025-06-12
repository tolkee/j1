import {
  forceSimulation,
  forceCenter,
  forceCollide,
  forceManyBody,
  forceRadial,
  Simulation,
} from "d3-force";
import { ServiceNode } from "../../types/types";

export class CloudLayoutEngine {
  private simulation: Simulation<ServiceNode, undefined>;
  private nodes: ServiceNode[] = [];
  private width: number;
  private height: number;
  private onUpdate: (nodes: ServiceNode[]) => void;

  constructor(
    width: number,
    height: number,
    onUpdate: (nodes: ServiceNode[]) => void
  ) {
    this.width = width;
    this.height = height;
    this.onUpdate = onUpdate;

    // Initialize d3-force simulation
    this.simulation = forceSimulation<ServiceNode>()
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius(40).strength(0.8))
      .force("charge", forceManyBody().strength(-300))
      .force(
        "radial",
        forceRadial(
          Math.min(width, height) * 0.2,
          width / 2,
          height / 2
        ).strength(0.1)
      )
      .alphaDecay(0.02)
      .velocityDecay(0.4)
      .on("tick", () => {
        this.constrainNodes();
        this.onUpdate([...this.nodes]);
      });
  }

  public setNodes(nodes: ServiceNode[]): void {
    this.nodes = nodes;
    this.simulation.nodes(this.nodes);
    this.simulation.alpha(0.3).restart();
  }

  public addNode(node: ServiceNode): void {
    this.nodes.push(node);
    this.simulation.nodes(this.nodes);
    this.simulation.alpha(0.3).restart();
  }

  public removeNode(nodeId: string): void {
    this.nodes = this.nodes.filter((node) => node.id !== nodeId);
    this.simulation.nodes(this.nodes);
    this.simulation.alpha(0.3).restart();
  }

  public updateDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;

    // Update forces with new dimensions
    this.simulation
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "radial",
        forceRadial(
          Math.min(width, height) * 0.2,
          width / 2,
          height / 2
        ).strength(0.1)
      );

    this.simulation.alpha(0.3).restart();
  }

  public applyForce(nodeId: string, fx: number, fy: number): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fx = fx;
      node.fy = fy;
      this.simulation.alpha(0.3).restart();
    }
  }

  public releaseForce(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  }

  public stop(): void {
    this.simulation.stop();
  }

  public restart(): void {
    this.simulation.alpha(0.3).restart();
  }

  private constrainNodes(): void {
    const padding = 50;

    this.nodes.forEach((node) => {
      // Constrain to viewport boundaries with padding
      node.x = Math.max(padding, Math.min(this.width - padding, node.x));
      node.y = Math.max(padding, Math.min(this.height - padding, node.y));
    });
  }
}
