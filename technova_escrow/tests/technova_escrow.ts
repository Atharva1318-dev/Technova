import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TechnovaEscrow } from "../target/types/technova_escrow";
import { expect } from "chai";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

describe("technova_escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TechnovaEscrow as Program<TechnovaEscrow>;

  // Test accounts
  let advisor: Keypair;
  let platformAuthority: Keypair;
  let escrowPDA: PublicKey;
  let escrowBump: number;

  const ESCROW_AMOUNT = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL

  before(async () => {
    // Generate keypairs
    advisor = Keypair.generate();
    platformAuthority = Keypair.generate();

    // Airdrop SOL to test accounts
    const airdropAdvisor = await provider.connection.requestAirdrop(
      advisor.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropAdvisor);

    const airdropPlatform = await provider.connection.requestAirdrop(
      platformAuthority.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropPlatform);

    // Derive escrow PDA
    [escrowPDA, escrowBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), advisor.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes an escrow account", async () => {
    const tx = await program.methods
      .initializeEscrow(
        new anchor.BN(ESCROW_AMOUNT),
        { signupFee: {} },
        null // No expiry
      )
      .accounts({
        escrowAccount: escrowPDA,
        advisor: advisor.publicKey,
        platformAuthority: platformAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([advisor])
      .rpc();

    console.log("Initialize escrow tx:", tx);

    // Fetch and verify escrow account
    const escrowAccount = await program.account.escrowAccount.fetch(escrowPDA);

    expect(escrowAccount.advisor.toString()).to.equal(
      advisor.publicKey.toString()
    );
    expect(escrowAccount.platformAuthority.toString()).to.equal(
      platformAuthority.publicKey.toString()
    );
    expect(escrowAccount.amount.toNumber()).to.equal(ESCROW_AMOUNT);
    expect(escrowAccount.status).to.deep.equal({ active: {} });
    expect(escrowAccount.escrowType).to.deep.equal({ signupFee: {} });
  });

  it("Funds an existing escrow", async () => {
    const additionalAmount = 0.05 * LAMPORTS_PER_SOL;

    const tx = await program.methods
      .fundEscrow(new anchor.BN(additionalAmount))
      .accounts({
        escrowAccount: escrowPDA,
        funder: advisor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([advisor])
      .rpc();

    console.log("Fund escrow tx:", tx);

    const escrowAccount = await program.account.escrowAccount.fetch(escrowPDA);
    expect(escrowAccount.amount.toNumber()).to.equal(
      ESCROW_AMOUNT + additionalAmount
    );
  });

  it("Releases escrow to advisor", async () => {
    const advisorBalanceBefore = await provider.connection.getBalance(
      advisor.publicKey
    );

    const escrowAccountBefore =
      await program.account.escrowAccount.fetch(escrowPDA);
    const escrowAmount = escrowAccountBefore.amount.toNumber();

    const tx = await program.methods
      .releaseEscrow()
      .accounts({
        escrowAccount: escrowPDA,
        advisor: advisor.publicKey,
        platformAuthority: platformAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([platformAuthority])
      .rpc();

    console.log("Release escrow tx:", tx);

    const escrowAccountAfter =
      await program.account.escrowAccount.fetch(escrowPDA);
    expect(escrowAccountAfter.amount.toNumber()).to.equal(0);
    expect(escrowAccountAfter.status).to.deep.equal({ released: {} });

    const advisorBalanceAfter = await provider.connection.getBalance(
      advisor.publicKey
    );
    expect(advisorBalanceAfter).to.equal(advisorBalanceBefore + escrowAmount);
  });

  it("Closes the escrow account", async () => {
    const tx = await program.methods
      .closeEscrow()
      .accounts({
        escrowAccount: escrowPDA,
        platformAuthority: platformAuthority.publicKey,
        rentReceiver: advisor.publicKey,
      })
      .signers([platformAuthority])
      .rpc();

    console.log("Close escrow tx:", tx);

    // Verify account is closed
    const escrowAccount =
      await provider.connection.getAccountInfo(escrowPDA);
    expect(escrowAccount).to.be.null;
  });

  it("Creates and refunds an escrow", async () => {
    // Create new advisor for this test
    const advisor2 = Keypair.generate();
    const recipient = Keypair.generate();

    const airdrop = await provider.connection.requestAirdrop(
      advisor2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop);

    const [escrowPDA2] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), advisor2.publicKey.toBuffer()],
      program.programId
    );

    // Initialize escrow
    await program.methods
      .initializeEscrow(new anchor.BN(ESCROW_AMOUNT), { performanceBond: {} }, null)
      .accounts({
        escrowAccount: escrowPDA2,
        advisor: advisor2.publicKey,
        platformAuthority: platformAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([advisor2])
      .rpc();

    // Refund to recipient
    const tx = await program.methods
      .refundEscrow()
      .accounts({
        escrowAccount: escrowPDA2,
        recipient: recipient.publicKey,
        platformAuthority: platformAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([platformAuthority])
      .rpc();

    console.log("Refund escrow tx:", tx);

    const escrowAccount = await program.account.escrowAccount.fetch(escrowPDA2);
    expect(escrowAccount.status).to.deep.equal({ refunded: {} });

    const recipientBalance = await provider.connection.getBalance(
      recipient.publicKey
    );
    expect(recipientBalance).to.equal(ESCROW_AMOUNT);
  });
});
