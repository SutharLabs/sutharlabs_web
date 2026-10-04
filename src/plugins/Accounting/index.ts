import { manifest } from "./manifest.js";
import AccountingView from "../../components/AccountingView";

export const AccountingPlugin = {
  manifest,
  View: AccountingView
};

export { manifest, AccountingView as View };
export default AccountingPlugin;
