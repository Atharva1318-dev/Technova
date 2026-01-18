import { Keypair } from "@solana/web3.js";

const keypair = Keypair.generate();

console.log("=".repeat(70));
console.log("🔑 PLATFORM AUTHORITY KEYPAIR GENERATED");
console.log("=".repeat(70));
console.log("\n📍 Public Key (Platform Authority Address):");
console.log(keypair.publicKey.toString());
console.log("\n🔐 Secret Key (Add this to .env as PLATFORM_SECRET_KEY):");
console.log(JSON.stringify(Array.from(keypair.secretKey)));
console.log("\n⚠️  SECURITY WARNING:");
console.log("   - KEEP THE SECRET KEY SECURE!");
console.log("   - Never commit it to git");
console.log("   - Never share it with anyone");
console.log("   - Store it in .env file only");
console.log("\n💰 Next Steps:");
console.log("   1. Copy the secret key array above");
console.log("   2. Add to backend/.env as PLATFORM_SECRET_KEY=<array>");
console.log("   3. Fund the address with devnet SOL:");
console.log(`      solana airdrop 2 ${keypair.publicKey.toString()} --url devnet`);
console.log("=".repeat(70));

