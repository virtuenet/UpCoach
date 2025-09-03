declare module '@mui/material/Grid' {
  import { GridProps } from '@mui/material/Grid';
  
  export interface CustomGridProps extends GridProps {
    item?: boolean;
    xs?: number;
    sm?: number;
    md?: number;
    component?: React.ElementType;
  }

  declare const Grid: React.ComponentType<CustomGridProps>;
  export default Grid;
}