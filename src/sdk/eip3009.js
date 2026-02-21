// src/sdk/eip3009.js
import { ethers } from "ethers";

/**
 * EIP-3009: transferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce,bytes signature)
 *
 * We sign typed data using EIP-712:
 * domain = { name:"SETA", version:"1", chainId, verifyingContract }
 * types = { TransferWithAuthorization: [...] }
 * message = { from, to, value, validAfter, validBefore, nonce }
 */

export const SETA_EIP712_DOMAIN = {
  name: "SETA",
  version: "1",
};

export const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

export function makeAuthorizationNonceBytes32() {
  // 32 bytes randomness, hex string
  return ethers.utils.hexlify(ethers.utils.randomBytes(32));
}

export function buildEIP3009TypedData({
  chainId,
  verifyingContract, // SETA token contract address
  from,
  to,
  value,             // string/BN in wei
  validAfter,        // unix seconds
  validBefore,       // unix seconds
  nonce,             // bytes32
}) {
  if (!chainId) throw new Error("chainId required");
  if (!verifyingContract) throw new Error("verifyingContract required");
  if (!ethers.utils.isAddress(from)) throw new Error("Invalid from");
  if (!ethers.utils.isAddress(to)) throw new Error("Invalid to");
  if (!nonce || !ethers.utils.isHexString(nonce, 32)) {
    throw new Error("nonce must be bytes32 hex");
  }

  const domain = {
    ...SETA_EIP712_DOMAIN,
    chainId: Number(chainId),
    verifyingContract,
  };

  const message = {
    from,
    to,
    value: ethers.BigNumber.from(value).toString(),
    validAfter: String(validAfter),
    validBefore: String(validBefore),
    nonce,
  };

  return { domain, types: EIP3009_TYPES, message, primaryType: "TransferWithAuthorization" };
}

export async function signEIP3009Authorization({
  signer,            // ethers Signer
  chainId,
  verifyingContract,
  from,
  to,
  value,
  validAfter,
  validBefore,
  nonce,
}) {
  const { domain, types, message } = buildEIP3009TypedData({
    chainId,
    verifyingContract,
    from,
    to,
    value,
    validAfter,
    validBefore,
    nonce,
  });

  // ethers v5: signer._signTypedData(domain, types, message)
  const signature = await signer._signTypedData(domain, types, message);

  return {
    domain,
    types,
    message,
    signature,
  };
}
