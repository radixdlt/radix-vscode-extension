export function getStokenetAccountWebView(
  accountName: string,
  virtualAccount: string,
  mnemonic: string,
  privateKey: string,
  publicKey: string
) {
  return `
        <h1>Stokenet Account</h1>
		<p> View the details of an account by clicking on the account name in the Stokenet Accounts tree view panel.</p>
		<h3>Account Name: ${accountName}</h3>
        <p><strong>Account Address:</strong> ${virtualAccount}</p>
        <p>Mnemonic: ${mnemonic}</p>
        <p>Private Key: ${privateKey}</p>
        <p>Public Key: ${publicKey}</p>
		<a href="https://stokenet-dashboard.radixdlt.com/account/${virtualAccount}/tokens">View Account on Dashboard</a>
    `;
}
