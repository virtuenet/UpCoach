export interface UserEvent {
  type: (element: any, text: string) => Promise<void>;
  click: (element: any) => Promise<void>;
  hover: (element: any) => Promise<void>;
  tab: () => Promise<void>;
  clear: (element: any) => Promise<void>;
  selectOptions: (element: any, value: any) => Promise<void>;
}