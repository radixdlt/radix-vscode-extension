export const getPackageDeployedSuccessfullyWebView = (
  packageAddress: string,
  intentHash: string,
) => `
    <html>
    <body>
        <h1>Stokenet Package Deployed Successfully!</h1>
        <p>Package Address: <span id="package-address" onclick="copyPackageAddress()">${packageAddress}</span></p>
        <button onclick="copyPackageAddress()">Copy Package Address</button>
        <p>View on the <a href="https://stokenet-dashboard.radixdlt.com/transaction/${intentHash}/details">Stokenet Dashboard</a></p>						
        <script>
            function copyPackageAddress() {
                const packageAddress = document.getElementById('package-address').innerText;
                navigator.clipboard.writeText(packageAddress);
            }
        </script>
    </body>
    </html>
`;
