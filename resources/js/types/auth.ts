export type User = {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    region: 'east' | 'west' | null;
};

export type Auth = {
    user: User | null;
};
