export type ProductFingerprint = {
    ui_style: "minimal" | "dense" | "colorful" | "dark" | "light";
    primary_colors: string[];
    key_features_visible: string[];
    emotional_problem_solved: string;
    unique_differentiator: string;
    founder_energy: "scrappy" | "polished" | "technical" | "friendly";
    product_stage: "waitlist" | "beta" | "launched";
};

export type Scene = {
    scene_id: number;
    duration_seconds: number;
    script_line: string;
    screenshot: string;
    motion: string;
    text_overlay: string;
    music_energy: "low" | "building" | "rising" | "peak" | "resolution";
    sfx: string;
    transition: string;
};

export type ProductionDocument = {
    video: {
        title: string;
        duration: number;
        tone: string;
        color_grade: string;
    };
    scenes: Scene[];
    cta: {
        text: string;
        url: string;
    };
};

export type VideoJobStatus = "pending" | "processing" | "done" | "failed";

export type VideoJob = {
    id: string;
    user_id: string;
    status: VideoJobStatus;
    credits_used: number;
    production_doc: ProductionDocument | null;
    output_url: string | null;
    created_at: Date;
};
