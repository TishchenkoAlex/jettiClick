export interface Account {
  email: string;
  description: string;
  created: string;
  status: string;
  isAdmin: boolean;
  roles: string[];
  env: { [x: string]: string };
  token: string;
}

export interface Authenticate {
  email: string;
  password: string;
}
