import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Table.css';

interface User {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: string;
    date_end: string;
}

const PrimeReactTable: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [pageNum, setPageNum] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [rowsToSelect, setRowsToSelect] = useState<number>(0); // State for number of rows to select
    const rowsPerPage = 12;
    const op = useRef<OverlayPanel>(null);

    // Fetch data from API
    const fetchData = async (page: number) => {
        try {
            const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
            const data = await response.json();

            const apiData: User[] = data.data.map((item: any) => ({
                id: item.id,
                title: item.title,
                place_of_origin: item.place_of_origin,
                artist_display: item.artist_display,
                inscriptions: item.inscriptions,
                date_start: item.date_start,
                date_end: item.date_end,
            }));

            setUsers(apiData);
            setTotalRecords(data.pagination.total);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Handle page change
    const onPageChange = (event: any) => {
        const newPageNum = event.page + 1;
        setPageNum(newPageNum);
    };

    // Handle input change in the overlay
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        setRowsToSelect(value); // Just update the state, selection logic will be handled on submit
    };

    // Fetch additional rows if the input number exceeds the current page
    const fetchAdditionalRows = async (currentPage: number, remainingRows: number): Promise<User[]> => {
        let fetchedRows: User[] = [];
        let nextPage = currentPage + 1;

        // Continue fetching data until the remaining rows are fulfilled
        while (fetchedRows.length < remainingRows && nextPage <= Math.ceil(totalRecords / rowsPerPage)) {
            const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${nextPage}`);
            const data = await response.json();

            const newRows: User[] = data.data.map((item: any) => ({
                id: item.id,
                title: item.title,
                place_of_origin: item.place_of_origin,
                artist_display: item.artist_display,
                inscriptions: item.inscriptions,
                date_start: item.date_start,
                date_end: item.date_end,
            }));

            fetchedRows = [...fetchedRows, ...newRows];
            nextPage++;
        }

        // Return only the number of rows needed to meet the requirement
        return fetchedRows.slice(0, remainingRows);
    };

    // Handle the submit action for selecting rows
    const handleSubmit = async () => {
        if (rowsToSelect > 0) {
            const rowsAvailableOnCurrentPage = users.length;
            let selectedRowsForCurrentPage = users;

            if (rowsToSelect <= rowsAvailableOnCurrentPage) {
                // If input is less than or equal to current page rows, select from the current page only
                selectedRowsForCurrentPage = users.slice(0, rowsToSelect);
            } else {
                // If input is greater, select all rows on the current page and fetch additional rows from the next pages
                selectedRowsForCurrentPage = users; // Select all rows from the current page
                const additionalRowsNeeded = rowsToSelect - rowsAvailableOnCurrentPage;
                const additionalRows = await fetchAdditionalRows(pageNum, additionalRowsNeeded);

                // Combine current page rows with additional rows from next pages
                selectedRowsForCurrentPage = [...selectedRowsForCurrentPage, ...additionalRows];
            }

            // Remove previously selected rows from the current page and append the new selection
            const newSelectedUsers = selectedUsers.filter(user => !users.some(u => u.id === user.id));

            // Combine previously selected rows with the newly selected ones
            setSelectedUsers([...newSelectedUsers, ...selectedRowsForCurrentPage]);
        }

        op.current?.hide(); // Close the overlay panel
    };

    // Re-fetch data when pageNum changes
    useEffect(() => {
        fetchData(pageNum);
    }, [pageNum]);

    return (
        <div className="card">
            <DataTable
                value={users}
                stripedRows={false}
                selection={selectedUsers}
                onSelectionChange={(e) => setSelectedUsers(e.value)}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple"></Column>
                <Column
                    field="title"
                    header={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <i
                                className="pi pi-chevron-down"
                                style={{ marginLeft: '0.5rem', cursor: 'pointer' }}
                                onClick={(e) => op.current?.toggle(e)}
                            ></i>
                            Title
                        </div>
                    }
                    headerStyle={{ textAlign: 'center' }}
                ></Column>
                <Column field="place_of_origin" header="Place Of Origin"></Column>
                <Column field="artist_display" header="Artist Display"></Column>
                <Column field="inscriptions" header="Inscriptions"></Column>
                <Column field="date_start" header="Date Start"></Column>
                <Column field="date_end" header="Date End"></Column>
            </DataTable>

            <OverlayPanel ref={op}>
                <div className='container'>
                    <input
                        type="number"
                        placeholder="Select Rows..."
                        className='input-field'
                        onChange={handleInputChange}
                    />
                    <button onClick={handleSubmit}>Submit</button>
                </div>
            </OverlayPanel>

            <Paginator
                first={(pageNum - 1) * rowsPerPage}
                rows={rowsPerPage}
                totalRecords={totalRecords}
                onPageChange={onPageChange}
            />
        </div>
    );
};

export default PrimeReactTable;