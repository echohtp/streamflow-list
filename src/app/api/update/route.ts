import { NextResponse } from "next/server";
import { dbOperations } from "../../lib/db";
import { IGetOneData } from "@streamflow/stream";
import { StreamflowSolana } from "@streamflow/stream";

const solanaClient = new StreamflowSolana.SolanaStreamClient(
  process.env.SOLANA_RPC || ""
);

export async function GET() {
  try {

    const contracts = await dbOperations.getAllContracts();
   
    for (const contract of contracts) {
      const streamData: IGetOneData = { id: contract.address };
      const stream = await solanaClient.getOne(streamData);
      if (stream) {
        dbOperations.updateContract(stream, contract.address);
      }
    }
    return NextResponse.json({ thanks: "thanks" });
  } catch (error) {
    console.error('Error updating:', error);
    return NextResponse.json({ error });
  }
}
