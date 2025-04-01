export interface MenuItem {
  label: string;
  name: string;
  to?: string;
  external?: boolean;
  children?: MenuItem[];
}