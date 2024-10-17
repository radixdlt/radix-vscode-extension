import { Account } from "../helpers/stokenet-accounts";

export function getStokenetAccountWebView(account: Account) {
  const { label, address, mnemonic, privateKey, publicKey } = account;
  return `
        <h1>Stokenet Account</h1>
		<p> View the details of an account by clicking on the account name in the Stokenet Accounts tree view panel.</p>
		<h3>Account Name: ${label}</h3>
        <p><strong>Account Address:</strong> ${address}</p>
        <p>Mnemonic: ${mnemonic}</p>
        <p>Private Key: ${privateKey}</p>
        <p>Public Key: ${publicKey}</p>
		<a href="https://stokenet-dashboard.radixdlt.com/account/${address}/tokens">View Account on Dashboard</a>
    `;
}
