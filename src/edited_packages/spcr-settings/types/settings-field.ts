export interface ISettingsFieldHidden {
  type: 'hidden';
  defaultValue: unknown;
  /** Fork addition: false hides the row (value still registers and persists). */
  visible?: boolean;
}

export interface ISettingsFieldInput {
  type: 'input';
  description?: string;
  defaultValue: string;
  inputType?: string;
  events?: Partial<React.InputHTMLAttributes<HTMLInputElement>>;
  /** Fork addition: false hides the row (value still registers and persists). */
  visible?: boolean;
}

export interface ISettingsFieldDropdown {
  type: 'dropdown';
  description?: string;
  defaultValue: string;
  options: string[];
  events?: Partial<React.SelectHTMLAttributes<HTMLSelectElement>>;
  /** Fork addition: false hides the row (value still registers and persists). */
  visible?: boolean;
}

export interface ISettingsFieldButton {
  type: 'button';
  description?: string;
  value: string;
  events?: Partial<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  /** Fork addition: false hides the row (value still registers and persists). */
  visible?: boolean;
}

export interface ISettingsFieldToggle {
  type: 'toggle';
  description?: string;
  defaultValue: boolean;
  events?: Partial<React.InputHTMLAttributes<HTMLInputElement>>;
  /** Fork addition: false hides the row (value still registers and persists). */
  visible?: boolean;
}

export type ISettingsField =
  | ISettingsFieldHidden
  | ISettingsFieldDropdown
  | ISettingsFieldInput
  | ISettingsFieldButton
  | ISettingsFieldToggle;

export type NewValueTypes = boolean | string;
