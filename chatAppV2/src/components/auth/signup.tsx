// on signupt create a user entry with an empty frinds list and incoming/outgoing request list

// they have full perms to their own document indicated by the presence of their uid within - update the rules

import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

import {
    getAuth,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
} from "firebase/auth";

import { Navigate } from "react-router-dom";

import { app, auth } from "../../firebase";
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  https://www.honeybadger.io/blog/encryption-and-decryption-in-typescript/

import { doc, getFirestore, setDoc, collection } from "firebase/firestore";

const db = getFirestore(app);


const createKeys = async () => {
    const keypair = await crypto.subtle.generateKey(
    {
        name: "ECDH",
        namedCurve: "P-521"
    },
    true,
    ["deriveKey", "deriveBits"]
    )
    return keypair;
}


//    const deriveSharedSecret = async (privateKey: CryptoKey, publicKey: CryptoKey) => {
//      const sharedSecret = await crypto.subtle.deriveBits(
//        {
//          name: "ECDH",
//          public: publicKey
//        },
//        privateKey,
//        256 // Length of the derived key in bits for use as the AES 256 encryptor
//      );
//
//      return new Uint8Array(sharedSecret);
//    };


const SignUp = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [userUID, setUserUID] = useState<string>("");
    const [exportedPublicKey, setExportedPublicKey] = useState<JsonWebKey>();
    const [privateKeyLink, setPrivateKeyLink] = useState<string>("#")
    //
        //
        //IF USER WISHES TO THEY CAN DOWNLOAD THE PRIVATE KEY AS A FILE TO BACKUP.
        //THE PRIVATE KEY WILL BE ENCRYPTED VIA WEB CRYPTO API USING A RANDOMLY GENERATED ENCRYPTION KEY AND IV VIA AES.
        //
        //
        //WHEN USER LOGS IN, THE PRIVATE KEY IN THEIR LOCAL OR SESSION STORAGE WILL BE DECRYPTED AND USABLE FOR DIFFIE HELLMAN KEYEXCHANGE
        //
        //
    // const [isLoading, setIsLoading] = useState(true);
    
    const generateKeys = () => {
        createKeys().then(keyPair => {
            console.log('Key Pair:', keyPair);
            console.log(keyPair.publicKey)
            console.log(keyPair.privateKey)
            // send publicKey to server
            //
            crypto.subtle.exportKey("jwk", keyPair.publicKey).then(expKey => {
                
                console.log('Exported Key:', expKey);
                
                setExportedPublicKey(expKey)

                console.log("executed create");

            });

            crypto.subtle.exportKey("jwk", keyPair.privateKey).then(expKey => {
            

                const privateKeyBlob = new Blob([JSON.stringify(expKey)], { type: "application/json" })

                setPrivateKeyLink(URL.createObjectURL(privateKeyBlob))
            });
        });

    } 
    

    const writeToFireBase = async (exportedPublicKey: JsonWebKey | undefined) => {
        
        console.log(userUID)
        const usersDoc = doc(db, "users", userUID);

        
        await setDoc(usersDoc, {
            publicKey: JSON.stringify(exportedPublicKey),
            friends: [],
            pendingFriends: [],
            incomingFriends: [],
        });

    }
    
    const signUpFirebase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const auth = getAuth();
            const userCreds = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            
            setUserUID(userCreds.user.uid);
        } catch (err) {
            return <Navigate to="/sign-up" />;
        }
    };


    useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setUserSignedIn(true);
                } else {
                    setUserSignedIn(false);
                }
            });

            return () => unsubscribe();
        }, []);

    useEffect(() => {
        console.log(userUID)
        generateKeys()

        console.log(userUID)
        console.log(exportedPublicKey)
    
        writeToFireBase(exportedPublicKey)

    }, [userUID])

    

    if (auth.currentUser === null) {
        return (
            <>
                <form onSubmit={signUpFirebase}>
                    <h1>Sign Up</h1>
                    <input
                        name="email"
                        placeholder="Email"
                        required
                        onChange={(e) =>
                            setEmail(DOMPurify.sanitize(e.target.value))
                        }
                    />
                    <br />
                    <br />
                    <input
                        name="password"
                        placeholder="Password"
                        type="password"
                        required
                        onChange={(e) =>
                            setPassword(DOMPurify.sanitize(e.target.value))
                        }
                    />
                    <br />
                    <button type="submit">click to sign up</button>
                </form>


                <h2>your private key download will appear here:</h2>
                <a href={privateKeyLink}>here</a>

                <p>
                    already have an account? log in <a href="/login">here</a>!
                </p>
            </>
        );
    } else {
        return (
            <>
                <Navigate to={"dashboard"} />
            </>
        );
    }
};

export default SignUp;
