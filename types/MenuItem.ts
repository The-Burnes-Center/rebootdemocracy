export interface DropdownItem {
  label: string;
  name: string;
  to?: string;
  external?: boolean;
}

export interface MenuItem extends DropdownItem {
  children?: DropdownItem[];
}
