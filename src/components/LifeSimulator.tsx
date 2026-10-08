import { useEffect, useRef, useState } from "react";
import type { LifeSimulator as Simulator } from "../game/lifeSimulator.ts";

type Status = "idle" | "loading" | "running" | "error";

// Add ?impatient to the URL to make matches pop in seconds instead of minutes.
const impatient = new URLSearchParams(window.location.search).has("impatient");
const TIMING = impatient ? { minQueue: 8, maxQueue: 15 } : { minQueue: 180, maxQueue: 420 };

export default function LifeSimulator() {
  const stageRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulator | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [vrSupported, setVrSupported] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => () => simRef.current?.dispose(), []);

  async function start() {
    if (!stageRef.current) return;
    setStatus("loading");
    try {
      // three.js is only downloaded when someone actually enters the basement.
      const { startLifeSimulator, isVRSupported } = await import("../game/lifeSimulator.ts");
      simRef.current = startLifeSimulator(stageRef.current, TIMING);
      stageRef.current.focus();
      setStatus("running");
      setVrSupported(await isVRSupported());
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  function toggleMute() {
    simRef.current?.setMuted(!muted);
    setMuted(!muted);
  }

  function fullscreen() {
    void stageRef.current?.requestFullscreen?.();
    stageRef.current?.focus();
  }

  return (
    <section id="life-sim" className="section section-alt">
      <div className="container">
        <h2>TTTTT Life Simulator</h2>
        <p className="muted">
          A realistic simulation of clan life. You are in a basement. You are in queue. You will always be in queue.
        </p>

        <div className="sim-stage" ref={stageRef} tabIndex={0}>
          {status !== "running" && (
            <div className="sim-overlay">
              {status === "error" ? (
                <p>The basement failed to load. Your browser may not support WebGL.</p>
              ) : (
                <button className="btn" onClick={start} disabled={status === "loading"}>
                  {status === "loading" ? "Descending..." : "Enter the basement"}
                </button>
              )}
            </div>
          )}
        </div>

        {status === "running" && (
          <div className="sim-controls">
            <p className="muted">
              Drag to look around. Click or press Space to accept a match. In VR, pull the trigger.
            </p>
            <div className="sim-buttons">
              <button className="btn btn-small btn-ghost" onClick={toggleMute}>
                {muted ? "Unmute" : "Mute"}
              </button>
              <button className="btn btn-small btn-ghost" onClick={fullscreen}>
                Fullscreen
              </button>
              {vrSupported && (
                <button className="btn btn-small" onClick={() => void simRef.current?.enterVR()}>
                  Enter VR
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
