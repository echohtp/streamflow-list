import { NextResponse, NextRequest } from "next/server";
import { StreamflowSolana, IGetOneData } from "@streamflow/stream";
import { dbOperations } from "../../lib/db";

const solanaClient = new StreamflowSolana.SolanaStreamClient(
  "https://api.mainnet-beta.solana.com"
);

export async function POST(request: NextRequest) {
  const data = await request.json();

  try {

    // check if the address is already in the database
    console.log("check if in db");
    const contract = dbOperations.getContractByMint(data.address);
    if (contract) {
      console.log("contract found");
      return NextResponse.json({ thanks: "thanks" });
    }

    const streamData: IGetOneData = { id: data.address };
    const stream = await solanaClient.getOne(streamData);
    if (
      stream &&
      stream.mint == "3XFiHA2gexzBjqtM5Z7FjJhP6f28D2m79UihBCfkpump"
    ) {
      
      console.log("stream found");
      console.log(stream);
      dbOperations.createContract(stream, data.address);
      return NextResponse.json({ thanks: "thanks" });
    }
  } catch (e) {
    return NextResponse.json({ error: e });
  }
}

export async function GET() {
  const contracts = dbOperations.getAllContracts();
  return NextResponse.json({ contracts });
}
