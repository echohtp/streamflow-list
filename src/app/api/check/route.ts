import { NextResponse, NextRequest } from "next/server";
import { StreamflowSolana, IGetOneData } from "@streamflow/stream";
import { dbOperations } from "../../lib/db";

const solanaClient = new StreamflowSolana.SolanaStreamClient(
  process.env.SOLANA_RPC || ""
);

export async function POST(request: NextRequest) {
  const data = await request.json();

  try {
    // check if the address is already in the database
    console.log("check if in db");
    const contract = await dbOperations.getContractByAddress(data.address);
    console.log("contract returned", contract);
    if (contract.length > 0) {
      console.log("contract found");
      return NextResponse.json({ thanks: "thanks" });
    }

    const streamData: IGetOneData = { id: data.address };
    const stream = await solanaClient.getOne(streamData);
    if (
      stream &&
      stream.mint == "3XFiHA2gexzBjqtM5Z7FjJhP6f28D2m79UihBCfkpump" && 
      stream.canceledAt == 0
    ) {
      
      console.log("stream found");
      console.log(stream);
      await dbOperations.createContract(stream, data.address);
      return NextResponse.json({ thanks: "thanks" });
    }else{
      return NextResponse.json({ error: "no valid stream found" });
    }
  } catch (e) {
    return NextResponse.json({ error: e });
  }
}

export async function GET() {
  console.log("get all contracts");
  const contracts = await dbOperations.getAllContracts();
  return NextResponse.json({ contracts });
}
