import { useMemo } from "react";
import { ServiceNode } from "../types/types";
import { JarvisService } from "../types/types";

export function useEqualSpacedLayout(
  width: number,
  height: number,
  services: JarvisService[]
) {
  const nodes = useMemo(() => {
    if (width <= 0 || height <= 0 || services.length === 0) {
      return [];
    }

    // Layout parameters for 3-4-3-4 pattern
    const iconSize = 70;
    const spacing = 85; // Spacing between icon centers
    const verticalSpacing = 85; // Height between rows

    // Alternating 3-4-3-4 pattern
    const getColsForRow = (row: number) => (row % 2 === 0 ? 3 : 4);

    // Calculate how many rows we need
    let totalServices = 0;
    let rows = 0;
    while (totalServices < services.length) {
      totalServices += getColsForRow(rows);
      rows++;
    }

    // Calculate layout dimensions
    const maxRowWidth = (4 - 1) * spacing; // Max width is for 4-icon rows
    const totalHeight = (rows - 1) * verticalSpacing;
    const startY = (height - totalHeight) / 2;

    const serviceNodes: ServiceNode[] = [];
    let serviceIndex = 0;

    for (let row = 0; row < rows && serviceIndex < services.length; row++) {
      const colsInThisRow = Math.min(
        getColsForRow(row),
        services.length - serviceIndex
      );

      // Center each row individually
      const rowWidth = (colsInThisRow - 1) * spacing;
      const rowStartX = (width - rowWidth) / 2;

      for (let col = 0; col < colsInThisRow; col++) {
        const service = services[serviceIndex];

        const x = rowStartX + col * spacing;
        const y = startY + row * verticalSpacing;

        serviceNodes.push({
          id: service.id,
          service,
          x,
          y,
        });

        serviceIndex++;
      }
    }

    return serviceNodes;
  }, [width, height, services]);

  return { nodes };
}
