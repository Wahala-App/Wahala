import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { retrieveUserInfo } from '@/app/actions/dataHandler';
const DATA_FILE = path.join(process.cwd(), 'data', 'incidents.json');



export async function GET(request: NextRequest)  {
 try {
   
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No idToken provided' }), { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    const userData = await retrieveUserInfo(idToken);

    console.log("Successul retrieved User data ")

    return NextResponse.json(userData, { status: 200 });
       
      
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return NextResponse.json(
        { error: `Error retrieving user data: ${error}` },
        { status: 400 });
 }
}


