import {
  Color,
  MaterialParameters,
  ShaderMaterial,
  Vector2
} from 'three';

export interface LineMaterialParameters extends MaterialParameters {
  color?: number;
  worldUnits: boolean;
  dashed?: boolean;
  dashScale?: number;
  dashSize?: number;
  gapSize?: number;
  linewidth?: number;
  resolution?: Vector2;
}

export class LineMaterial extends ShaderMaterial {
  constructor(parameters?: LineMaterialParameters);
  color: Color;
  worldUnits: boolean;
  dashed: boolean;
  dashScale: number;
  dashSize: number;
  gapSize: number;
  isLineMaterial: boolean;
  linewidth: number;
  resolution: Vector2;
}
