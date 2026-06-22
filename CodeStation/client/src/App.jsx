import { Route, HashRouter as Router, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Toast from "./components/toast/Toast";

// Lazy-load page components for bundle size optimization
const HomePage = lazy(() => import("./pages/HomePage"));
const EditorPage = lazy(() => import("./pages/EditorPage"));

const App = () => {
    return (
        <>
            <Router>
                <Suspense
                    fallback={
                        <div className="flex h-screen w-screen items-center justify-center bg-gray-950 font-mono text-white">
                            <span className="text-xl animate-pulse">Loading CodeStation...</span>
                        </div>
                    }
                >
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/editor/:roomId" element={<EditorPage />} />
                    </Routes>
                </Suspense>
            </Router>
            <Toast /> {/* Toast component from react-hot-toast */}
        </>
    );
};

export default App;
