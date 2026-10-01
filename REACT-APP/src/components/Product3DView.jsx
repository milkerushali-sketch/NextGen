import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

function ProductModel({ product }) {
  const accent = useMemo(() => {
    const palette = ["#8b5cf6", "#2dd4bf", "#f59e0b", "#60a5fa"];
    return palette[product.id % palette.length];
  }, [product.id]);

  return (
    <Float speed={2.2} rotationIntensity={1.5} floatIntensity={1.2}>
      <mesh position={[0, 0, 0]} castShadow>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial color={accent} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, -1.6, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.3, 0.3, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.7} />
      </mesh>
    </Float>
  );
}

export default function Product3DView({ product, isOpen, onClose }) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white dark:border-slate-800">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-violet-100">
                  3D product preview
                </div>
                <div className="mt-1 text-2xl font-black">{product.name}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-2xl text-violet-100"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="h-[480px] bg-slate-100 dark:bg-slate-950">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={1.25} />
                  <directionalLight position={[3, 2, 2]} intensity={1.7} />
                  <spotLight position={[-4, 4, 5]} intensity={1.2} />
                  <ProductModel product={product} />
                  <OrbitControls
                    enableZoom={false}
                    autoRotate
                    autoRotateSpeed={2.2}
                  />
                </Canvas>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                    Overview
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {product.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Price
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      ₹{product.price}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Rating
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {product.rating}/5
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                    Specifications
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>• Premium build with immersive performance</li>
                    <li>• Smart AI-powered adaptive settings</li>
                    <li>• Battery longevity for all-day use</li>
                    <li>• Optimized for modern productivity and lifestyle</li>
                  </ul>
                </div>

                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
                    Customer feedback
                  </div>
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                    “The design feels premium and the performance exceeds
                    expectations. A standout purchase.”
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
