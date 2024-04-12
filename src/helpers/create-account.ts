import crypto from 'node:crypto';
import { LTSRadixEngineToolkit, SimpleTransactionBuilder, RadixEngineToolkit, PrivateKey, PublicKey, NetworkId, ManifestBuilder, decimal, expression } from "@radixdlt/radix-engine-toolkit";
import * as bip39 from "bip39";
import { ok } from "neverthrow";
import { derivePath, getPublicKey } from "ed25519-hd-key";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";

const gateway = GatewayApiClient.initialize({
    basePath: "https://stokenet.radixdlt.com",
    applicationName: "Radic VSCode Extension",
});

export async function createAccount() {
    const privateKeySeed = crypto.randomBytes(32).toString('hex');
    console.log('Private Key:', privateKeySeed);

    const mnemonic = bip39.entropyToMnemonic(privateKeySeed);
    console.log('Mnemonic:', mnemonic);

    const mnemonicToSeed = ok(bip39.mnemonicToSeedSync(mnemonic).toString('hex'));
    console.log('Mnemonic to Seed:', mnemonicToSeed);

    // const DERIVATION_PATH = `m/44'/1022'/${networkId}'/${ENTITY_TYPE.ACCOUNT}'/${KEY_TYPE.TRANSACTION_SIGNING}'/${ENTITY_INDEX}'`
    const derivationPath = "m/44'/1022'/2'/525'/1460'/1'";
    const deriveChildKey = ok(derivePath(derivationPath, mnemonicToSeed.value));
    console.log('Derived Child Key:', deriveChildKey);

    const privateKEy = await deriveChildKey.value.key.toString('hex');
    const publicKey = getPublicKey(deriveChildKey.value.key, false).toString('hex');
    console.log('Private Key hex string:', privateKEy);
    console.log('Public Key hex string:', publicKey);
    // construct RET public key and private key
    const pubKey = new PublicKey.Ed25519(publicKey);
    const privKey = new PrivateKey.Ed25519(privateKEy);
    const dervPubKey = privKey.publicKey();
    console.log('PubKey:', pubKey.toString());
    console.log('Derived PubKey:', dervPubKey.toString());
    console.log('PrivKey:', privKey);
    // derive virtual account address
    const virtualAccount = await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(pubKey, NetworkId.Stokenet);
    console.log('Virtual Account:', virtualAccount.toString());
    const faucetManifest = new ManifestBuilder()
        .callMethod('component_tdx_2_1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxyulkzl', "lock_fee", [decimal(100)])
        .callMethod('component_tdx_2_1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxyulkzl', "free", [])
        .callMethod(virtualAccount.toString(), "deposit_batch", [expression("EntireWorktop")])
        .build();
    const strManifest = await RadixEngineToolkit.Instructions.convert(faucetManifest.instructions, NetworkId.Stokenet, "String");
    console.log('Faucet Manifest:', strManifest.value);
    const currentEpoch = await gateway.transaction.innerClient.transactionConstruction();
    console.log('Current Epoch:', currentEpoch);

    const faucetTransaction = await SimpleTransactionBuilder.freeXrdFromFaucet({
        networkId: NetworkId.Stokenet,
        validFromEpoch: currentEpoch.ledger_state.epoch,
        toAccount: virtualAccount
    });
    const transctionValid = await faucetTransaction.staticallyValidate(NetworkId.Stokenet);
    console.log('Faucet Transaction:', faucetTransaction);
    console.log('Transaction Valid:', transctionValid);
    const transctionHex = await faucetTransaction.toHex();
    const result = await gateway.transaction.innerClient.transactionSubmit({
        transactionSubmitRequest: {
            "notarized_transaction_hex": transctionHex,
        }
    });
    console.log('Transaction Result:', result);
}

createAccount();