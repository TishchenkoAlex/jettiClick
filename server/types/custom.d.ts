import { JTL } from '../std.lib';

declare global {
  namespace NodeJS {
    interface Global {
      lib: JTL
    }
  }
}
