export type TreeNode = {
    id: string;
    name: string;
    type: 'Container' | 'Node';
    children?: TreeNode[];
};

export const treeData: TreeNode[] = [
    {
        id: '1',
        name: 'Container 1',
        type: 'Container',
        children: [
            { id: '1-1', name: 'Node 1-1', type: 'Node' },
            { id: '1-2', name: 'Node 1-2', type: 'Node' },
        ],
    },
    {
        id: '2',
        name: 'Container 2',
        type: 'Container',
        children: [
            {
                id: '2-1',
                name: 'Container 2-1',
                type: 'Container',
                children: [{ id: '2-1-1', name: 'Node 2-1-1', type: 'Node' }],
            },
            {
                id: '2-2',
                name: 'Container 2-2',
                type: 'Container',
                children: [
                    { id: '2-2-1', name: 'Node 2-2-1', type: 'Node' },
                    { id: '2-2-2', name: 'Node 2-2-2', type: 'Node' },
                ],
            },
        ],
    },
];
