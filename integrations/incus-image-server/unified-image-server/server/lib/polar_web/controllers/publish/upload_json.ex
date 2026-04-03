defmodule PolarWeb.Publish.UploadJSON do
  alias Polar.Streams.Item

  def create(%{items: items}) do
    %{data: Enum.map(items, &item/1)}
  end

  defp item(%Item{} = i) do
    %{
      id: i.id,
      name: i.name,
      file_type: i.file_type,
      hash: i.hash,
      size: i.size,
      path: i.path,
      is_metadata: i.is_metadata
    }
  end
end
