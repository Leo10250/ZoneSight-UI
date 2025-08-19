import { useState } from "react";
import "./App.css";
import ZonesPanel from "./components/ZonesPanel";

function App() {
    const [imgSize, setImgSize] = useState<[number, number]>([0, 0]);
    const API = "http://localhost:8000";
    return (
        <>
            <div style={{ position: "relative", display: "inline-block" }}>
                <img
                    src={`${API}/video`}
                    alt="live"
                    onLoad={(e) =>
                        setImgSize([
                            e.currentTarget.naturalWidth,
                            e.currentTarget.naturalHeight,
                        ])
                    }
                    style={{
                        display: "block",
                        border: "1px solid #eee",
                        maxWidth: 720,
                    }}
                />
                {imgSize[0] > 0 && (
                    <ZonesPanel width={imgSize[0]} height={imgSize[1]} />
                )}
            </div>
        </>
    );
}

export default App;
