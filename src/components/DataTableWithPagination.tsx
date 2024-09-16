import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: Date;
  date_end: Date;
}

const fetchArtworks = async (page: number) => {
  const response = await axios.get(
    `https://api.artic.edu/api/v1/artworks?page=${page}`
  );
  return response.data;
};

const DataTableWithPagination: React.FC = () => {
  const [selectedArtworks, setSelectedArtworks] = useState<Set<number>>(
    new Set()
  ); 
  const [selectionCount, setSelectionCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const overlayPanelRef = useRef<OverlayPanel>(null);

  // Updated useQuery with Object form
  const { data, isLoading, error } = useQuery({
    queryKey: ["artworks", currentPage],
    queryFn: () => fetchArtworks(currentPage),
    keepPreviousData: true,
    select: (data) => {
      return {
        artworks: data.data,
        totalRecords: data.pagination.total,
      };
    },
  });

  if (isLoading)
    return (
      <div className=" w-full h-screen flex items-center justify-center border ">
        <p>Loading...</p>
      </div>
    );
  if (error) return <p>An error occurred: {error.message}</p>;

  const { artworks = [], totalRecords = 0 } = data || {};

  const onPageChange = (event: any) => {
    setCurrentPage(event.page + 1);
  };

  const onCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    artworkId: number
  ) => {
    const isChecked = e.target.checked;
    setSelectedArtworks((prev) => {
      const newSelected = new Set(prev);
      if (isChecked) {
        newSelected.add(artworkId);
      } else {
        newSelected.delete(artworkId);
      }
      return newSelected;
    });
  };

  const handleSubmitSelection = async () => {
    if (selectionCount && selectionCount > 0) {
      const totalPages = Math.ceil(totalRecords / 12);
      let remaining = selectionCount;
      let page = currentPage;
      const newSelectedArtworks = new Set(selectedArtworks);

      while (remaining > 0 && page <= totalPages) {
        const response = await fetchArtworks(page);
        const { data } = response;
        console.log(data);
        const rowsToSelect = Math.min(remaining, data.length);

        for (let i = 0; i < rowsToSelect; i++) {
          if (data[i]) {
            newSelectedArtworks.add(data[i].id);
          }
        }

        remaining -= rowsToSelect;
        page++;
      }

      setSelectedArtworks(newSelectedArtworks);
    }
    overlayPanelRef.current?.hide();
  };

  const isChecked = (artworkId: number) => {
    return selectedArtworks.has(artworkId);
  };


  return (
    <div className=" h-full w-[90%] mx-auto mt-10">
      <OverlayPanel ref={overlayPanelRef} dismissable>
        <div className="p-fluid">
          <h4 className="text-sm font-bold">Select Rows</h4>
          <InputNumber
            value={selectionCount}
            onValueChange={(e) => setSelectionCount(e.value)}
            min={1}
            max={totalRecords}
            placeholder="Enter number of rows"
            className="border px-4 py-3 mt-4 rounded-md focus:outline-none"
          />
          <Button
            label="Submit"
            icon="pi pi-check"
            onClick={handleSubmitSelection}
            disabled={!selectionCount || selectionCount < 1}
            className="mt-4 px-4 py-3 text-xl active:font-bold font-semibold bg-cyan-400 text-white hover:cursor-pointer"
          />
        </div>
      </OverlayPanel>

      <DataTable
        value={artworks}
        rows={12}
        dataKey="id"
        selectionMode="multiple"
        selection={Array.from(selectedArtworks)}
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column
          body={(rowData: Artwork) => (
            <Checkbox
              checked={isChecked(rowData.id)}
              onChange={(e) => onCheckboxChange(e, rowData.id)}
              className=" border rounded-sm border-black "
            />
          )}
          headerStyle={{ width: "3em" }}
        />
        <Column
          header={
            <Button
              icon="pi pi-chevron-down"
              onClick={(e) => overlayPanelRef.current?.toggle(e)}
            />
          }
          body={() => null}
          headerStyle={{ textAlign: "center", width: "3em" }}
        />
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place of origin"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start date"></Column>
        <Column field="date_end" header="End date"></Column>
      </DataTable>

      <Paginator
        first={(currentPage - 1) * 12}
        rows={12}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        className=" mb-10 mt-5 "
      />
    </div>
  );
};

export default DataTableWithPagination;
