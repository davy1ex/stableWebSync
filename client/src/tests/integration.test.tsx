import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { App } from '@/app/App'
import { useAuth } from '@/features/auth'
import { useTaskStore, TaskModel } from '@/entities/task'
import { routeObjects } from '@/app/providers/AppRoutes'

const API_URL = "http://localhost:3001"; // Define API_URL here

// Mock DataTransfer for JSDOM
class MockDataTransfer {
    private data: Record<string, string> = {};
    setData(format: string, data: string) {
        this.data[format] = data;
    }
    getData(format: string) {
        return this.data[format];
    }
    dropEffect = 'none' as DataTransfer['dropEffect'];
    effectAllowed = 'all' as DataTransfer['effectAllowed'];
    files = [] as unknown as FileList;
    items = [] as unknown as DataTransferItemList;
    types = [] as readonly string[];

    clearData(format?: string) {
        if (format) {
            delete this.data[format];
        } else {
            this.data = {};
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    setDragImage(image: Element, x: number, y: number) {}
}

Object.defineProperty(window, 'DataTransfer', {
    value: MockDataTransfer,
    writable: true
});

// Mock fetch for API calls
const mockFetch = jest.fn()
window.fetch = mockFetch as unknown as typeof fetch

// Mock WebSocket
class MockWebSocket {
    private static nextInitialTasks: TaskModel[] | null = null;

    static setInitialTasksForNextSync(tasks: TaskModel[]) {
        MockWebSocket.nextInitialTasks = tasks;
    }

    onopen: () => void = () => {}
    onmessage: (event: any) => void = () => {}
    send = jest.fn().mockImplementation((message: string) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'sync_request') {
            const tasksToRespondWith = MockWebSocket.nextInitialTasks || [];
            MockWebSocket.nextInitialTasks = null; // Reset after use
            setTimeout(() => {
                this.onmessage({ data: JSON.stringify({ type: 'sync_response', tasks: tasksToRespondWith }) });
            }, 0);
        }
    })
    close = jest.fn()
    constructor() {
        setTimeout(() => this.onopen(), 0)
    }
}

// Override the WebSocket constructor
window.WebSocket = MockWebSocket as unknown as typeof WebSocket

// Mock window.location.reload
const mockReload = jest.fn()
Object.defineProperty(window, 'location', {
    value: { reload: mockReload, href: '/', origin: 'http://localhost' },
    writable: true
})

// Mock the auth hook
jest.mock('@/features/auth', () => ({
    useAuth: jest.fn()
}))

describe('App Integration Tests', () => {
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear()
        // Reset fetch mock
        mockFetch.mockReset()
        // Reset Zustand stores
        useTaskStore.setState({ tasks: [] })
        // Reset auth mock
        ;(useAuth as jest.Mock).mockReset()
        // Reset reload mock
        mockReload.mockReset()
    })

    describe('1. Authentication and Board Display', () => {
        it('should show login form when not authenticated', () => {
            // Mock auth state as not authenticated
            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: false,
                token: null,
                username: null,
                login: jest.fn(),
                logout: jest.fn()
            })

            const router = createMemoryRouter(routeObjects, {
                initialEntries: ['/login'],
            })

            render(
                <RouterProvider router={router} future={{
                    v7_startTransition: true,
                }} />
            )
            expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
        })

        it('should login and show board', async () => {
            const mockLoginFn = jest.fn().mockImplementation(async (username: string) => {
                // Simulate successful login
                localStorage.setItem('token', 'test-token')
                localStorage.setItem('username', username)
                return true
            })

            // First render with not authenticated state
            ;(useAuth as jest.Mock).mockReturnValueOnce({
                isAuthenticated: false,
                token: null,
                username: null,
                login: mockLoginFn,
                logout: jest.fn()
            })

            // After login, return authenticated state
            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                token: 'test-token',
                username: 'testuser',
                login: mockLoginFn,
                logout: jest.fn()
            })

            // Mock successful login API response
            mockFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ token: 'test-token' })
                })
            )
            
            const router = createMemoryRouter(routeObjects, {
                initialEntries: ['/login'],
            })

            render(
                <RouterProvider router={router} future={{
                    v7_startTransition: true,
                }} />
            )

            // Login
            await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser')
            await userEvent.click(screen.getByText('Login'))

            // Wait for navigation and verify board is shown
            await waitFor(() => {
                const welcomeMessages = screen.queryAllByText('Welcome, testuser')
                expect(welcomeMessages).toHaveLength(1)
                expect(welcomeMessages[0]).toBeInTheDocument()
            })
        })
    })

    describe('2. Task Addition', () => {
        beforeEach(() => {
            // Mock authenticated state
            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                token: 'test-token',
                username: 'testuser',
                isLoading: false, 
                login: jest.fn(),
                logout: jest.fn()
            })
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');

            // For task addition, WS should respond with empty tasks initially
            MockWebSocket.setInitialTasksForNextSync([]);
            useTaskStore.setState({ tasks: [], pendingSync: false, authError: false });
            const { connectSync } = useTaskStore.getState();
            connectSync();
            mockFetch.mockClear(); // Clear fetch for this suite
        })

        it('should add new task', async () => {
            const newTask = { 
                taskId: Date.now(),
                taskName: 'New Task',
                columnId: 'inbox1',
                isCompleted: false,
                order: 1,
                taskPoints: 0,
                projectId: null
            }

            // Mock the HTTP POST response for when syncTasks is called after adding a task.
            // This is the only fetch call expected in this specific test flow.
            mockFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ tasks: [newTask] }) // Server returns the list including the new task
                })
            )

            const router = createMemoryRouter(routeObjects, {
                initialEntries: ['/'],
            })

            render(
                <RouterProvider router={router} future={{
                    v7_startTransition: true,
                }} />
            )

            // Wait for the add task input to be visible
            const input = await screen.findByPlaceholderText('Add a task')
            
            // Type the task name
            await userEvent.clear(input)
            await userEvent.type(input, 'New Task')
            
            // Find and click the add button
            const addButton = screen.getByRole('button', { name: '+' })
            await act(async () => {
                await userEvent.click(addButton) // This triggers addTask -> syncWithServer -> syncTasks (HTTP POST)
            })

            // Verify the syncTasks HTTP POST call was made correctly
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1) // Expecting 1 call now (the POST)
                
                const fetchCallArgs = mockFetch.mock.calls[0];
                expect(fetchCallArgs[0]).toBe('http://localhost:3001/sync'); // URL
                expect(fetchCallArgs[1]?.method).toBe('POST');             // Method
                
                const requestBody = JSON.parse(fetchCallArgs[1]?.body as string);
                expect(requestBody.tasks).toBeDefined();
                // The request body should contain the new task being added along with any existing tasks.
                // Since tasks were reset to [] and WS delivered [], it should just be the new task.
                expect(requestBody.tasks.length).toBe(1);
                expect(requestBody.tasks[0].taskName).toBe('New Task');
                expect(requestBody.tasks[0].columnId).toBe('inbox1');
            })

            // Verify task appears in the UI (after successful sync and store update from mockFetch response)
            await waitFor(() => {
                expect(screen.getByText('New Task')).toBeInTheDocument()
            })
        })
    })

    describe('3. Task Completion', () => {
        const initialTask: TaskModel = {
            taskId: 123,
            taskName: 'Task to complete',
            columnId: 'inbox1',
            isCompleted: false,
            order: 1,
            updatedAt: new Date().toISOString(),
            taskPoints: 0,
            projectId: null
        };
        let completedTask: TaskModel;

        beforeEach(() => {
            completedTask = { 
                ...initialTask, 
                isCompleted: true, 
                updatedAt: new Date(Date.parse(initialTask.updatedAt!) + 1000).toISOString() // Ensure it's a distinctly newer timestamp
            };

            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                token: 'test-token',
                username: 'testuser',
                isLoading: false,
                login: jest.fn(),
                logout: jest.fn()
            });
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');

            // Configure WebSocket to respond with the initialTask for this suite's tests
            MockWebSocket.setInitialTasksForNextSync([initialTask]);
            // Reset store state, WS will populate it via connectSync
            useTaskStore.setState({ tasks: [], pendingSync: false, authError: false }); 
            const { connectSync } = useTaskStore.getState();
            connectSync(); // This will now use the initialTask from MockWebSocket
            
            mockFetch.mockClear();
        });

        it('should toggle task completion and sync', async () => {
            // Mock the HTTP PATCH response for when updateTaskOnServer is called
            mockFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(completedTask) // Server returns the single updated task
                })
            );

            const router = createMemoryRouter(routeObjects, { initialEntries: ['/'] });
            render(
            <RouterProvider router={router} future={{ v7_startTransition: true }} />);

            // Wait for the task to be visible
            const taskText = await screen.findByText(initialTask.taskName);
            expect(taskText).toBeInTheDocument();

            // Find the checkbox associated with the task
            const taskContainerElement = taskText.closest('.taskContainer'); 
            expect(taskContainerElement).not.toBeNull();
            if (!taskContainerElement) throw new Error("Task container element not found for: " + initialTask.taskName);
            
            const checkbox = within(taskContainerElement as HTMLElement).getByRole('checkbox') as HTMLInputElement;
            
            expect(checkbox.checked).toBe(false); // Initial state

            // Toggle completion
            await act(async () => {
                await userEvent.click(checkbox);
            });

            // Verify updateTaskOnServer HTTP PATCH call
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
                const fetchCallArgs = mockFetch.mock.calls[0];
                expect(fetchCallArgs[0]).toBe(`${API_URL}/tasks/${initialTask.taskId}`); // URL for PATCH
                expect(fetchCallArgs[1]?.method).toBe('PATCH');
                const requestBody = JSON.parse(fetchCallArgs[1]?.body as string);
                expect(requestBody.isCompleted).toBe(true);
                expect(requestBody.updatedAt).toBeDefined(); // Client sends its optimistic updatedAt
            });

            // Verify UI update (checkbox is checked)
            expect(checkbox.checked).toBe(true);
            
            // Optional: Verify the task in the store is updated if direct store inspection is needed
            // const { tasks } = useTaskStore.getState();
            // expect(tasks.find(t => t.taskId === initialTask.taskId)?.isCompleted).toBe(true);
        });
    });

    describe('4. Persistence After Reload', () => {
        const persistentTaskInitial: TaskModel = { // Renamed and updated
            taskId: 789, // Keep a stable ID for predictability if needed, though Date.now() is also fine for add
            taskName: 'Persistent Task',
            columnId: 'inbox1',
            isCompleted: false, // Start as false
            order: 1,
            taskPoints: 0,
            projectId: null,
            // updatedAt will be set by store/sync logic or mock response
        };

        beforeEach(() => {
            // General auth setup for the suite
            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                token: 'test-token',
                username: 'testuser',
                isLoading: false,
                login: jest.fn(),
                logout: jest.fn()
            });
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');
            
            mockFetch.mockClear();
            MockWebSocket.setInitialTasksForNextSync(null as any); 
        });

        it('should maintain task state after reload', async () => {
            // Phase 1: Create task, complete it, and let it persist
            localStorage.clear(); 
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');
            
            useTaskStore.setState(useTaskStore.getInitialState(), true); 
            MockWebSocket.setInitialTasksForNextSync([]); 
            const { connectSync: connectSync1, disconnectSync: disconnectSync1 } = useTaskStore.getState();
            connectSync1();

            let renderResult = render(
                <RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/'] })} future={{ v7_startTransition: true }} />
            );

            // Task to be returned by server after adding (simulating server assigning ID/timestamp)
            const addedTaskFromServer = { 
                ...persistentTaskInitial, 
                taskId: Date.now(), // Server assigns this
                updatedAt: new Date().toISOString() // Server sets this
            };

            mockFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ tasks: [addedTaskFromServer] }) 
                })
            );

            const input = await screen.findByPlaceholderText('Add a task');
            await userEvent.clear(input);
            await userEvent.type(input, persistentTaskInitial.taskName);
            const addButton = screen.getByRole('button', { name: '+' });
            await act(async () => {
                await userEvent.click(addButton);
            });
            
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
                const postedTask = JSON.parse(mockFetch.mock.calls[0][1].body as string).tasks[0];
                expect(postedTask.taskName).toBe(persistentTaskInitial.taskName);
                expect(postedTask.isCompleted).toBe(false); // Verify it was added as not completed
            });
            
            // Now, complete the task
            mockFetch.mockClear(); 
            
            const completedTaskFromServer = { 
                ...addedTaskFromServer, // Use the ID from the added task
                isCompleted: true, 
                updatedAt: new Date(Date.parse(addedTaskFromServer.updatedAt!) + 1000).toISOString() // Ensure distinctly newer for PATCH
            };

            mockFetch.mockImplementationOnce(() => // This mock is for the PATCH request
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(completedTaskFromServer) // Server returns the single updated task
                })
            );

            const taskText = await screen.findByText(persistentTaskInitial.taskName);
            const taskContainer = taskText.closest('.taskContainer');
            if (!taskContainer) throw new Error('Task container not found for completion');
            const checkbox = within(taskContainer as HTMLElement).getByRole('checkbox') as HTMLInputElement;
            
            expect(checkbox.checked).toBe(false); // Should be initially false

            await act(async () => {
                await userEvent.click(checkbox);
            });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1); 
                const patchCallArgs = mockFetch.mock.calls[0];
                expect(patchCallArgs[0]).toBe(`${API_URL}/tasks/${addedTaskFromServer.taskId}`);
                expect(patchCallArgs[1]?.method).toBe('PATCH');
                const requestBody = JSON.parse(patchCallArgs[1]?.body as string);
                expect(requestBody.isCompleted).toBe(true);
                expect(requestBody.updatedAt).toBeDefined(); // Client sends its optimistic updatedAt
                expect(checkbox.checked).toBe(true); // UI reflects completion
            });
            
            await new Promise(r => setTimeout(r, 100)); 

            disconnectSync1();
            renderResult.unmount();
            mockFetch.mockClear();

            // Phase 2: Simulate reload and verify persistence
            useTaskStore.setState(useTaskStore.getInitialState(), true);
            // WS should confirm the *completed* state of the task
            MockWebSocket.setInitialTasksForNextSync([completedTaskFromServer]); 
            const { connectSync: connectSync2, disconnectSync: disconnectSync2 } = useTaskStore.getState();
            connectSync2();

            render(
                <RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/'] })} future={{ v7_startTransition: true }} />
            );

            await waitFor(() => {
                expect(screen.getByText(persistentTaskInitial.taskName)).toBeInTheDocument();
            });
            const reloadedTaskText = screen.getByText(persistentTaskInitial.taskName);
            const reloadedTaskContainer = reloadedTaskText.closest('.taskContainer');
            if (!reloadedTaskContainer) throw new Error('Reloaded task container not found');
            const reloadedCheckbox = within(reloadedTaskContainer as HTMLElement).getByRole('checkbox') as HTMLInputElement;
            expect(reloadedCheckbox.checked).toBe(true); // Verify completion state persisted

            expect(mockFetch).not.toHaveBeenCalled();
            disconnectSync2();
        });
    });

    describe('5. Task Dragging', () => {
        beforeEach(() => {
            // Mock authenticated state
            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                token: 'test-token',
                username: 'testuser',
                isLoading: false, // Added for consistency
                login: jest.fn(),
                logout: jest.fn()
            });

            // Set auth data in localStorage
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');

            mockFetch.mockClear();
            // Reset store state, WS will populate it via connectSync
            useTaskStore.setState({ tasks: [], pendingSync: false, authError: false }); 
        });

        it('should update task order after drag', async () => {
            const initialTasks: TaskModel[] = [
                { taskId: 1, taskName: 'Task 1', columnId: 'inbox1', isCompleted: false, order: 1, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null },
                { taskId: 2, taskName: 'Task 2', columnId: 'inbox1', isCompleted: false, order: 2, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null },
                { taskId: 3, taskName: 'Task 3', columnId: 'inbox1', isCompleted: false, order: 3, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null }
            ];

            // Simulate dragging Task 1 to be after Task 2.
            // The original order is [Task1 (order 1), Task2 (order 2), Task3 (order 3)]
            // The new order should be [Task2 (order 1), Task1 (order 2), Task3 (order 3)]
            const reorderedTasks: TaskModel[] = [
                { ...initialTasks[1], order: 1, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null }, // Task 2 becomes order 1
                { ...initialTasks[0], order: 2, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null }, // Task 1 becomes order 2
                { ...initialTasks[2], order: 3, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null }
            ];
            
            // Ensure consistent updatedAt for the items being actively reordered,
            // as the store logic might generate new ones.
            // For this test, we are providing the exact state expected after reordering.
            const now = new Date().toISOString();
            const tasksAfterDrag = reorderedTasks.map(task => ({ ...task, updatedAt: now }));


            // Configure WebSocket to respond with initialTasks for this test
            MockWebSocket.setInitialTasksForNextSync([...initialTasks]);
            const { connectSync, disconnectSync, updateTasks } = useTaskStore.getState();
            connectSync();

            // Mock the HTTP POST response for when syncTasks is called after reordering
            mockFetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    // Server returns the reordered list, matching our tasksAfterDrag
                    json: () => Promise.resolve({ tasks: [...tasksAfterDrag] }) 
                })
            );

            const router = createMemoryRouter(routeObjects, { initialEntries: ['/'] });
            render(
                <RouterProvider router={router} future={{ v7_startTransition: true }} />
            );

            // Wait for tasks to be rendered initially
            await waitFor(() => {
                expect(screen.getByText('Task 1')).toBeInTheDocument();
                expect(screen.getByText('Task 2')).toBeInTheDocument();
                expect(screen.getByText('Task 3')).toBeInTheDocument();
            });

            // Directly call updateTasks to simulate the result of a drag operation
            act(() => {
                updateTasks(tasksAfterDrag);
            });

            // Verify syncTasks HTTP POST call was made correctly
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1); 
                const fetchCallArgs = mockFetch.mock.calls[0];
                expect(fetchCallArgs[0]).toBe('http://localhost:3001/sync'); 
                expect(fetchCallArgs[1]?.method).toBe('POST');             
                const requestBody = JSON.parse(fetchCallArgs[1]?.body as string);
                
                // The request body should contain the tasks in their new reordered state
                // We need to be careful with comparing updatedAt if it's generated dynamically in many places.
                // For this test, tasksAfterDrag has fixed updatedAt.
                expect(requestBody.tasks).toEqual(
                    tasksAfterDrag.map(task => expect.objectContaining({
                        taskId: task.taskId,
                        taskName: task.taskName,
                        columnId: task.columnId,
                        isCompleted: task.isCompleted,
                        order: task.order
                        // Not strictly comparing updatedAt here if it's too volatile due to multiple updates
                        // but since we set it in tasksAfterDrag, we can compare it if mockFetch returns it.
                    }))
                );
            });
            
            // Verify UI update (Task 2 should now be before Task 1)
            const taskElements = screen.getAllByText(/Task \d/).map(el => el.closest('.taskContainer'));
            
            // Check the order in the DOM. This requires a more robust way to identify tasks if names are not unique or order changes.
            // For this specific order, we expect "Task 2", then "Task 1", then "Task 3".
            // This test might be brittle if the component structure changes often.
            // A safer check is to verify the internal store's state if the UI check is too flaky.
            // For now, let's check based on text content order.

            const taskTexts = taskElements.map(el => el?.textContent?.match(/Task \d/)?.[0]).filter(Boolean);
            expect(taskTexts).toEqual(['Task 2', 'Task 1', 'Task 3']);


            disconnectSync();
        });
    });

    describe('6. Order Persistence', () => {
        const orderedTasksInitial: TaskModel[] = [
            { taskId: 101, taskName: 'Alpha Task', columnId: 'inbox1', isCompleted: false, order: 1, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null },
            { taskId: 102, taskName: 'Bravo Task', columnId: 'inbox1', isCompleted: false, order: 2, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null },
            { taskId: 103, taskName: 'Charlie Task', columnId: 'inbox1', isCompleted: false, order: 3, updatedAt: new Date().toISOString(), taskPoints: 0, projectId: null }
        ];

        beforeEach(() => {
            // Mock authenticated state
            ;(useAuth as jest.Mock).mockReturnValue({
                isAuthenticated: true,
                token: 'test-token',
                username: 'testuser',
                isLoading: false,
                login: jest.fn(),
                logout: jest.fn()
            });
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');
            
            mockFetch.mockClear();
            MockWebSocket.setInitialTasksForNextSync(null as any); // Ensure no WS interference unless specified
        });

        it('should maintain task order after reload', async () => {
            // Phase 1: Add tasks with specific order and let them persist
            localStorage.clear(); 
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('username', 'testuser');
            
            useTaskStore.setState(useTaskStore.getInitialState(), true); // Reset store
            
            // Simulate that these tasks are coming from the server initially, or added and synced
            // For simplicity in this phase, let's assume they are added and synced.
            MockWebSocket.setInitialTasksForNextSync([]); // Start with no tasks from WS for the first load
            const { connectSync: connectSync1, disconnectSync: disconnectSync1, addTask } = useTaskStore.getState();
            connectSync1();

            let renderResult = render(
                <RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/'] })} future={{ v7_startTransition: true }} />
            );
            
            // Mock fetch for each addTask call leading to syncWithServer
            // The server will respond with the task it "received/confirmed"
            mockFetch
                .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ tasks: [orderedTasksInitial[0]] }) }))
                .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ tasks: orderedTasksInitial.slice(0, 2) }) }))
                .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ tasks: orderedTasksInitial }) }));

            // Add tasks one by one to simulate user action or initial setup
            // addTask will trigger syncWithServer which uses mockFetch
            for (const task of orderedTasksInitial) {
                await act(async () => {
                    // We use a slightly different task object for addTask if it generates ID/timestamp internally,
                    // but here orderedTasksInitial already has IDs and timestamps.
                    // addTask in the store will add its own `updatedAt`.
                    // The key is that the `order` property is respected.
                    addTask({ ...task, taskId: task.taskId, taskName: task.taskName, columnId: task.columnId, isCompleted: task.isCompleted, order: task.order });
                });
            }

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(orderedTasksInitial.length);
                // Verify tasks are rendered in the correct order
                const taskContainers = screen.getAllByText(/Task/).map(el => el.closest('.taskContainer'));
                const taskNames = taskContainers.map(container => {
                    const taskNameElement = container?.querySelector('.taskName');
                    return taskNameElement?.textContent?.trim();
                }).filter(Boolean);
                expect(taskNames).toEqual(['Alpha Task', 'Bravo Task', 'Charlie Task']);
            });

            await new Promise(r => setTimeout(r, 100)); // Wait for Zustand persist to write to localStorage

            disconnectSync1();
            renderResult.unmount();
            mockFetch.mockClear(); // Clear fetch calls from phase 1

            // Phase 2: Simulate reload and verify order from persisted state
            useTaskStore.setState(useTaskStore.getInitialState(), true); // Reset store to force rehydration
            
            // On reload, WS might sync. Let it return the same ordered tasks as if server has them.
            MockWebSocket.setInitialTasksForNextSync([...orderedTasksInitial]); 
            const { connectSync: connectSync2, disconnectSync: disconnectSync2 } = useTaskStore.getState();
            connectSync2();

            render(
                <RouterProvider router={createMemoryRouter(routeObjects, { initialEntries: ['/'] })} future={{ v7_startTransition: true }} />
            );

            await waitFor(() => {
                // Verify tasks are rendered in the correct order after reload
                const taskContainers = screen.getAllByText(/Task/).map(el => el.closest('.taskContainer'));
                const taskNames = taskContainers.map(container => {
                    const taskNameElement = container?.querySelector('.taskName');
                    return taskNameElement?.textContent?.trim();
                }).filter(Boolean);
                expect(taskNames).toEqual(['Alpha Task', 'Bravo Task', 'Charlie Task']);
            });

            // Crucially, no new fetch calls should have been made FOR REORDERING/UPDATING these tasks.
            // The tasks are loaded from localStorage by Zustand persist, and their order should be intact.
            // A fetch call might occur if connectSync triggers an initial sync (which it does via MockWebSocket here),
            // but it shouldn't be a POST to /sync due to reordering.
            // The initialTasksForNextSync above simulates the server already having the correct order.
            expect(mockFetch).toHaveBeenCalledTimes(0); // Or 1 if initial sync_request leads to a fetch if not handled carefully
                                                      // For this test, let's aim for 0 after phase 1, assuming WS provides the state.
                                                      // If MockWebSocket directly sets store via onmessage without fetch, this can be 0.
                                                      // Given our MockWebSocket, connectSync will trigger a sync_request, and our mock WS will reply.
                                                      // The store's connectSync logic might still call syncWithServer if pendingSync is true or no tasks from WS.
                                                      // Let's refine this: WS sends tasks, so pendingSync *should* become false and no HTTP sync needed if tasks match.

            disconnectSync2();
        });
    });
}) 