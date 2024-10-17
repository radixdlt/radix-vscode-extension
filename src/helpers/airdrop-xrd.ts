import {
  SimpleTransactionBuilder,
  NetworkId,
} from "@radixdlt/radix-engine-toolkit";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";

const gateway = GatewayApiClient.initialize({
  basePath: "https://stokenet.radixdlt.com",
  applicationName: "Radix VSCode Extension",
});

/**
 * Submits a transaction to the Stokenet faucet to airdrop XRD to the given account address.
 *
 * @param accountAddress The address of the account to airdrop XRD to.
 */
export async function airdropXRD(accountAddress: string) {
  const currentEpoch =
    await gateway.transaction.innerClient.transactionConstruction();
  const faucetTransaction = await SimpleTransactionBuilder.freeXrdFromFaucet({
    networkId: NetworkId.Stokenet,
    validFromEpoch: currentEpoch.ledger_state.epoch,
    toAccount: accountAddress,
  });

  const transctionHex = await faucetTransaction.toHex();
  const intentHash = faucetTransaction.intentHash.id;
  const result = await gateway.transaction.innerClient.transactionSubmit({
    transactionSubmitRequest: {
      notarized_transaction_hex: transctionHex,
    },
  });
}
