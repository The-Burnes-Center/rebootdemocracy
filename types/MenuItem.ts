export interface DropdownItem {
  label: string;
  name: string;
  to?: string;
  external?: boolean;
  children?: MenuItem[];
  category?: string;
}

export interface MenuItem extends DropdownItem {
  children?: DropdownItem[];
}
